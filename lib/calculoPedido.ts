import type { SupabaseClient } from "@supabase/supabase-js";

/** Acima deste subtotal (R$) o frete é grátis. */
const MINIMO_FRETE_GRATIS = 150;

/** Arredonda para centavos. */
const cent = (v: number) => Math.round(v * 100) / 100;

export interface ItemPedidoEntrada {
  produtoId: string;
  quantidade: number;
}

export interface LinhaCalculada {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface PedidoCalculado {
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  linhas: LinhaCalculada[];
}

/**
 * Calcula os valores do pedido A PARTIR DOS PREÇOS REAIS DO BANCO — nunca dos
 * valores enviados pelo cliente. É a FONTE ÚNICA de verdade usada tanto na
 * criação do pedido (/api/pedido) quanto na cobrança (/api/pagamento), o que
 * garante que o total gravado e o total cobrado sejam idênticos (sem divergir
 * um centavo por arredondamento).
 *
 * Lança erro (mensagem segura de exibir) quando algo não confere: produto
 * inexistente/indisponível, item de outra loja, ou lista vazia.
 */
export async function calcularPedido(
  sb: SupabaseClient,
  itens: ItemPedidoEntrada[],
  lojaId: string,
  cupomCodigo?: string,
): Promise<PedidoCalculado> {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error("Itens do pedido ausentes.");
  }

  const ids = itens.map((i) => i.produtoId);
  const { data: produtos, error } = await sb
    .from("produtos")
    .select("id, nome, preco, desconto, loja_id, disponivel")
    .in("id", ids);
  if (error) throw new Error("Falha ao consultar produtos.");

  const linhas: LinhaCalculada[] = [];
  let subtotal = 0;
  for (const item of itens) {
    const p = produtos?.find((x) => x.id === item.produtoId);
    if (!p || p.disponivel === false) throw new Error("Produto indisponível.");
    if (p.loja_id !== lojaId) throw new Error("Itens de lojas diferentes.");
    const qtd = Math.max(1, Math.floor(Number(item.quantidade) || 0));
    const desc = Number(p.desconto) || 0;
    const precoUnitario = cent(Number(p.preco) * (1 - desc / 100));
    subtotal += precoUnitario * qtd;
    linhas.push({
      produtoId: p.id as string,
      nome: (p.nome as string) ?? "",
      quantidade: qtd,
      precoUnitario,
    });
  }

  const { data: loja } = await sb
    .from("lojas")
    .select("taxa_entrega")
    .eq("id", lojaId)
    .maybeSingle();
  let frete = subtotal >= MINIMO_FRETE_GRATIS ? 0 : Number(loja?.taxa_entrega) || 0;

  let descontoCupom = 0;
  if (cupomCodigo) {
    const { data: cupom } = await sb
      .from("cupons")
      .select("tipo, valor, ativo")
      .eq("loja_id", lojaId)
      .eq("codigo", String(cupomCodigo).trim().toUpperCase())
      .eq("ativo", true)
      .maybeSingle();
    if (cupom) {
      if (cupom.tipo === "frete") frete = 0;
      else if (cupom.tipo === "percentual")
        descontoCupom = subtotal * (Number(cupom.valor) / 100);
      else if (cupom.tipo === "fixo")
        descontoCupom = Math.min(Number(cupom.valor), subtotal);
    }
  }

  const total = cent(Math.max(0, subtotal - descontoCupom) + frete);
  return {
    subtotal: cent(subtotal),
    frete: cent(frete),
    desconto: cent(descontoCupom),
    total,
    linhas,
  };
}

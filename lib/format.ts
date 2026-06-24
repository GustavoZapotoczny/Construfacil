import type { Produto } from "@/types";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor numérico em reais. brl(12.5) => "R$ 12,50" */
export function brl(valor: number): string {
  return brlFormatter.format(valor);
}

/** Preço final do produto considerando o desconto (% de oferta). */
export function precoComDesconto(produto: Produto): number {
  if (!produto.desconto) return produto.preco;
  return produto.preco * (1 - produto.desconto / 100);
}

/** Formata distância: 0.8 => "800 m", 2.4 => "2,4 km". Vazio se ausente. */
export function distancia(km?: number): string {
  if (km === undefined || km <= 0) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

/** Data ISO para algo legível: "23/06 às 14:32" */
export function dataHora(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}

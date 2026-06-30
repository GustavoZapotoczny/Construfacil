import { supabase } from "@/lib/supabase";
import * as mock from "@/lib/data";
import { useLojista } from "@/lib/lojista";
import { usePedidos, novoNumeroPedido } from "@/lib/pedidos";
import { useSessao } from "@/lib/sessao";
import { useEnderecos } from "@/lib/enderecos";
import { precoComDesconto } from "@/lib/format";
import type {
  Categoria,
  Cupom,
  Endereco,
  FormaPagamento,
  ItemCarrinho,
  Loja,
  Pedido,
  Produto,
  StatusPedido,
  TipoCupom,
} from "@/types";

// ─────────────────────────────────────────────────────────────
// Camada de dados. Cada função consulta o Supabase quando há
// `supabase`; caso contrário usa os mocks/stores (modo demonstração).
// ─────────────────────────────────────────────────────────────

const num = (v: unknown): number => Number(v ?? 0) || 0;

// ---------- Tipos das linhas retornadas pelo Supabase ----------
type Numerico = number | string | null;

interface LojaRow {
  id: string;
  nome: string;
  descricao: string | null;
  logo_url: string | null;
  endereco: string | null;
  nota: Numerico;
  taxa_entrega: Numerico;
  tempo_estimado: string | null;
  aberta: boolean | null;
  latitude?: Numerico;
  longitude?: Numerico;
  raio_entrega_km?: Numerico;
  horario?: import("@/types").HorarioDia[] | null;
  formas_pagamento?: string[] | null;
}

interface ProdutoRow {
  id: string;
  loja_id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  foto_url: string | null;
  preco: Numerico;
  unidade: string | null;
  estoque: Numerico;
  desconto: Numerico;
  disponivel: boolean | null;
}

interface CupomRow {
  id: string;
  loja_id: string;
  codigo: string;
  tipo: string;
  valor: Numerico;
  validade: string | null;
  ativo: boolean | null;
}

interface ItemRow {
  produto_id: string | null;
  nome: string | null;
  quantidade: Numerico;
  preco_unitario: Numerico;
}

interface PedidoRow {
  id: string;
  cliente_id: string;
  cliente_nome: string | null;
  loja_id: string;
  lojas?: { nome: string } | null;
  loja_nome?: string | null;
  itens_pedido?: ItemRow[] | null;
  status: string;
  subtotal: Numerico;
  frete: Numerico;
  desconto: Numerico;
  total: Numerico;
  forma_pagamento: string | null;
  cupom_codigo: string | null;
  endereco_resumo: string | null;
  criado_em: string | null;
}

// ---------- Mappers (linha do banco → tipo do app) ----------
function mapLoja(r: LojaRow): Loja {
  return {
    id: r.id,
    nome: r.nome,
    descricao: r.descricao ?? "",
    logo: r.logo_url || "🏗️",
    endereco: r.endereco ?? "",
    nota: num(r.nota),
    taxaEntrega: num(r.taxa_entrega),
    tempoEstimado: r.tempo_estimado ?? "",
    aberta: r.aberta ?? true,
    latitude: r.latitude != null ? Number(r.latitude) : undefined,
    longitude: r.longitude != null ? Number(r.longitude) : undefined,
    raioEntregaKm:
      r.raio_entrega_km != null ? Number(r.raio_entrega_km) : undefined,
    horario: r.horario ?? undefined,
    formasPagamento: r.formas_pagamento ?? undefined,
  };
}

function mapProduto(r: ProdutoRow): Produto {
  return {
    id: r.id,
    lojaId: r.loja_id,
    categoriaId: r.categoria_id ?? "",
    nome: r.nome,
    descricao: r.descricao ?? "",
    foto: r.foto_url || "📦",
    preco: num(r.preco),
    unidade: r.unidade ?? "un",
    estoque: num(r.estoque),
    desconto: num(r.desconto),
    disponivel: r.disponivel ?? true,
  };
}

function mapCupom(r: CupomRow): Cupom {
  return {
    id: r.id,
    lojaId: r.loja_id,
    codigo: r.codigo,
    tipo: r.tipo as TipoCupom,
    valor: num(r.valor),
    validade: r.validade ?? "",
    ativo: r.ativo ?? true,
  };
}

function mapPedido(r: PedidoRow): Pedido {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    clienteNome: r.cliente_nome ?? undefined,
    lojaId: r.loja_id,
    lojaNome: r.lojas?.nome ?? r.loja_nome ?? "Loja",
    itens: (r.itens_pedido ?? []).map((it) => ({
      produtoId: it.produto_id ?? "",
      nome: it.nome ?? "Item",
      quantidade: num(it.quantidade),
      precoUnitario: num(it.preco_unitario),
    })),
    status: r.status as StatusPedido,
    subtotal: num(r.subtotal),
    frete: num(r.frete),
    desconto: num(r.desconto),
    total: num(r.total),
    formaPagamento: (r.forma_pagamento ?? "pix") as FormaPagamento,
    cupomCodigo: r.cupom_codigo ?? undefined,
    enderecoResumo: r.endereco_resumo ?? "",
    criadoEm: r.criado_em ?? new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO (cliente)
// ═══════════════════════════════════════════════════════════════

export async function listarCategorias(): Promise<Categoria[]> {
  if (!supabase) return mock.categorias;
  const { data, error } = await supabase.from("categorias").select("*");
  if (error) throw error;
  // mantém a ordem fixa do app (mock.categorias define a ordem desejada)
  const ordem = mock.categorias.map((c) => c.id);
  return (data ?? [])
    .map((r) => ({ id: r.id, nome: r.nome, emoji: r.emoji ?? "📦" }))
    .sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id));
}

export async function listarLojas(): Promise<Loja[]> {
  if (!supabase) return mock.lojas;
  const { data, error } = await supabase
    .from("lojas")
    .select("*")
    .order("nome");
  if (error) throw error;
  return (data ?? []).map(mapLoja);
}

export async function listarTodosProdutos(): Promise<Produto[]> {
  if (!supabase) {
    // No demo, a loja ativa é servida pelo store do lojista (com edições).
    const ativos = useLojista.getState().produtos;
    return [
      ...mock.produtos.filter((p) => p.lojaId !== mock.LOJA_ATIVA_ID),
      ...ativos,
    ].filter((p) => p.disponivel);
  }
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("disponivel", true);
  if (error) throw error;
  return (data ?? []).map(mapProduto);
}

export async function getLoja(id: string): Promise<Loja | null> {
  if (!supabase) return mock.getLoja(id) ?? null;
  const { data, error } = await supabase
    .from("lojas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLoja(data) : null;
}

/** Catálogo visível ao cliente (apenas produtos disponíveis). */
export async function listarProdutos(lojaId: string): Promise<Produto[]> {
  if (!supabase) {
    const base =
      lojaId === mock.LOJA_ATIVA_ID
        ? useLojista.getState().produtos
        : mock.produtosDaLoja(lojaId);
    return base.filter((p) => p.disponivel);
  }
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("loja_id", lojaId)
    .eq("disponivel", true)
    .order("nome");
  if (error) throw error;
  return (data ?? []).map(mapProduto);
}

export async function validarCupom(
  lojaId: string,
  codigo: string,
): Promise<Cupom | null> {
  const alvo = codigo.trim().toUpperCase();
  if (!alvo) return null;
  if (!supabase) {
    const fonte =
      lojaId === mock.LOJA_ATIVA_ID
        ? useLojista.getState().cupons.filter((c) => c.ativo)
        : mock.cuponsDaLoja(lojaId);
    return fonte.find((c) => c.codigo === alvo) ?? null;
  }
  const { data, error } = await supabase
    .from("cupons")
    .select("*")
    .eq("loja_id", lojaId)
    .eq("codigo", alvo)
    .eq("ativo", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCupom(data) : null;
}

// ═══════════════════════════════════════════════════════════════
// PEDIDOS (cliente)
// ═══════════════════════════════════════════════════════════════

export interface NovoPedidoInput {
  loja: Loja;
  linhas: ItemCarrinho[];
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  formaPagamento: FormaPagamento;
  cupomCodigo?: string;
  enderecoId?: string;
  enderecoResumo: string;
  /** Status inicial. Padrão "Novo"; no fluxo de pagamento real usa-se
   *  "Aguardando pagamento" (só o webhook promove para "Novo"). */
  status?: StatusPedido;
}

/** Cria o pedido (pedidos + itens_pedido) e retorna o id. */
export async function criarPedido(input: NovoPedidoInput): Promise<string> {
  const itens = input.linhas.map(({ produto, quantidade }) => ({
    produtoId: produto.id,
    nome: produto.nome,
    quantidade,
    precoUnitario: precoComDesconto(produto),
  }));

  if (!supabase) {
    // Modo demo: grava no histórico local e, se for a loja do painel,
    // também injeta no store do lojista (para a demonstração cruzada).
    const id = novoNumeroPedido();
    const pedido: Pedido = {
      id,
      clienteId: "mock-cliente",
      clienteNome: useSessao.getState().usuario?.nome ?? "Cliente",
      lojaId: input.loja.id,
      lojaNome: input.loja.nome,
      itens,
      status: input.status ?? "Novo",
      subtotal: input.subtotal,
      frete: input.frete,
      desconto: input.desconto,
      total: input.total,
      formaPagamento: input.formaPagamento,
      cupomCodigo: input.cupomCodigo,
      enderecoResumo: input.enderecoResumo,
      criadoEm: new Date().toISOString(),
    };
    usePedidos.getState().criar(pedido);
    if (input.loja.id === mock.LOJA_ATIVA_ID) {
      useLojista.setState((s) => ({ pedidos: [pedido, ...s.pedidos] }));
    }
    return id;
  }

  const { data: auth } = await supabase.auth.getUser();
  const clienteId = auth.user?.id;
  if (!clienteId) throw new Error("Faça login para finalizar o pedido.");

  const { data: ped, error } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: clienteId,
      cliente_nome: useSessao.getState().usuario?.nome ?? null,
      loja_id: input.loja.id,
      endereco_id: input.enderecoId ?? null,
      endereco_resumo: input.enderecoResumo,
      status: input.status ?? "Novo",
      subtotal: input.subtotal,
      frete: input.frete,
      desconto: input.desconto,
      total: input.total,
      forma_pagamento: input.formaPagamento,
      cupom_codigo: input.cupomCodigo ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  const linhasItens = itens.map((it) => ({
    pedido_id: ped.id,
    produto_id: it.produtoId,
    nome: it.nome,
    quantidade: it.quantidade,
    preco_unitario: it.precoUnitario,
  }));
  const { error: errItens } = await supabase
    .from("itens_pedido")
    .insert(linhasItens);
  if (errItens) throw errItens;

  return ped.id as string;
}

export async function listarPedidosCliente(): Promise<Pedido[]> {
  if (!supabase) return usePedidos.getState().pedidos;
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, lojas(nome), itens_pedido(*)")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPedido);
}

export async function getPedido(id: string): Promise<Pedido | null> {
  if (!supabase) return usePedidos.getState().getPedido(id) ?? null;
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, lojas(nome), itens_pedido(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPedido(data) : null;
}

// ═══════════════════════════════════════════════════════════════
// PERFIL DO CLIENTE — dados pessoais e endereços
// ═══════════════════════════════════════════════════════════════

export interface MeuPerfil {
  nome: string;
  telefone: string;
  email: string;
}

export async function getMeuPerfil(): Promise<MeuPerfil> {
  const u = useSessao.getState().usuario;
  if (!supabase) {
    return { nome: u?.nome ?? "", telefone: "", email: u?.email ?? "" };
  }
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { nome: "", telefone: "", email: "" };
  const { data } = await supabase
    .from("perfis")
    .select("nome, telefone")
    .eq("id", user.id)
    .maybeSingle();
  return {
    nome: data?.nome ?? u?.nome ?? "",
    telefone: data?.telefone ?? "",
    email: user.email ?? "",
  };
}

export async function atualizarMeuPerfil(patch: {
  nome?: string;
  telefone?: string;
}): Promise<void> {
  // Reflete o nome na sessão local (header do perfil, etc.).
  if (patch.nome) {
    const s = useSessao.getState();
    if (s.usuario) s.entrar({ ...s.usuario, nome: patch.nome });
  }
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { error } = await supabase
    .from("perfis")
    .update(patch)
    .eq("id", auth.user.id);
  if (error) throw error;
}

interface EnderecoRow {
  id: string;
  apelido: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  cep: string | null;
}

function mapEndereco(r: EnderecoRow): Endereco {
  return {
    id: r.id,
    apelido: r.apelido ?? "",
    rua: r.rua ?? "",
    numero: r.numero ?? "",
    complemento: r.complemento ?? undefined,
    cidade: r.cidade ?? "",
    cep: r.cep ?? "",
  };
}

export async function listarEnderecos(): Promise<Endereco[]> {
  if (!supabase) return useEnderecos.getState().lista;
  const { data, error } = await supabase
    .from("enderecos")
    .select("*")
    .order("apelido");
  if (error) throw error;
  return (data ?? []).map(mapEndereco);
}

export async function criarEndereco(e: Omit<Endereco, "id">): Promise<void> {
  if (!supabase) {
    useEnderecos.getState().add(e);
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faça login para salvar endereços.");
  const { error } = await supabase.from("enderecos").insert({
    usuario_id: auth.user.id,
    apelido: e.apelido,
    rua: e.rua,
    numero: e.numero,
    complemento: e.complemento ?? null,
    cidade: e.cidade,
    cep: e.cep,
  });
  if (error) throw error;
}

export async function atualizarEndereco(
  id: string,
  patch: Partial<Omit<Endereco, "id">>,
): Promise<void> {
  if (!supabase) {
    useEnderecos.getState().update(id, patch);
    return;
  }
  const { error } = await supabase.from("enderecos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function excluirEndereco(id: string): Promise<void> {
  if (!supabase) {
    useEnderecos.getState().remove(id);
    return;
  }
  const { error } = await supabase.from("enderecos").delete().eq("id", id);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════
// LOJISTA — loja, produtos, cupons, pedidos
// ═══════════════════════════════════════════════════════════════

/** Loja do lojista logado; cria uma padrão se ainda não existir. */
export async function getMinhaLoja(): Promise<Loja | null> {
  if (!supabase) return mock.getLoja(useLojista.getState().lojaId) ?? null;

  const { data: auth } = await supabase.auth.getUser();
  const donoId = auth.user?.id;
  if (!donoId) return null;

  const { data, error } = await supabase
    .from("lojas")
    .select("*")
    .eq("dono_id", donoId)
    .order("criado_em")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return mapLoja(data);

  // Sem loja ainda: cria uma padrão para o lojista poder operar.
  const nomePadrao = useSessao.getState().usuario?.nome
    ? `Loja de ${useSessao.getState().usuario!.nome}`
    : "Minha loja";
  const { data: nova, error: errNova } = await supabase
    .from("lojas")
    .insert({
      dono_id: donoId,
      nome: nomePadrao,
      descricao: "Materiais de construção",
      logo_url: "🏗️",
      aberta: true,
      taxa_entrega: 0,
      tempo_estimado: "30-45 min",
    })
    .select("*")
    .single();
  if (errNova) throw errNova;
  return mapLoja(nova);
}

/** Atualiza campos da loja (patch com nomes de coluna do banco). */
export async function atualizarLoja(
  lojaId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  if (!supabase) return; // demo: edição de loja não persiste
  const { error } = await supabase.from("lojas").update(patch).eq("id", lojaId);
  if (error) throw error;
}

export async function setLojaAberta(
  lojaId: string,
  aberta: boolean,
): Promise<void> {
  if (!supabase) {
    if (useLojista.getState().aberta !== aberta)
      useLojista.getState().toggleAberta();
    return;
  }
  const { error } = await supabase
    .from("lojas")
    .update({ aberta })
    .eq("id", lojaId);
  if (error) throw error;
}

/** Produtos da loja para o painel do lojista (inclui indisponíveis). */
export async function listarProdutosDaLoja(lojaId: string): Promise<Produto[]> {
  if (!supabase) return useLojista.getState().produtos;
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("loja_id", lojaId)
    .order("nome");
  if (error) throw error;
  return (data ?? []).map(mapProduto);
}

export interface NovoProdutoInput {
  lojaId: string;
  nome: string;
  categoriaId: string;
  descricao: string;
  foto: string;
  preco: number;
  unidade: string;
  estoque: number;
  disponivel: boolean;
}

export async function criarProduto(input: NovoProdutoInput): Promise<void> {
  if (!supabase) {
    useLojista.getState().addProduto(input);
    return;
  }
  const { error } = await supabase.from("produtos").insert({
    loja_id: input.lojaId,
    categoria_id: input.categoriaId,
    nome: input.nome,
    descricao: input.descricao,
    foto_url: input.foto,
    preco: input.preco,
    unidade: input.unidade,
    estoque: input.estoque,
    desconto: 0,
    disponivel: input.disponivel,
  });
  if (error) throw error;
}

export async function setProdutoDisponivel(
  produtoId: string,
  disponivel: boolean,
): Promise<void> {
  if (!supabase) {
    useLojista.getState().toggleDisponivel(produtoId);
    return;
  }
  const { error } = await supabase
    .from("produtos")
    .update({ disponivel })
    .eq("id", produtoId);
  if (error) throw error;
}

export async function setProdutoDesconto(
  produtoId: string,
  desconto: number,
): Promise<void> {
  if (!supabase) {
    useLojista.getState().setDesconto(produtoId, desconto);
    return;
  }
  const { error } = await supabase
    .from("produtos")
    .update({ desconto })
    .eq("id", produtoId);
  if (error) throw error;
}

export async function listarCuponsDaLoja(lojaId: string): Promise<Cupom[]> {
  if (!supabase) return useLojista.getState().cupons;
  const { data, error } = await supabase
    .from("cupons")
    .select("*")
    .eq("loja_id", lojaId)
    .order("codigo");
  if (error) throw error;
  return (data ?? []).map(mapCupom);
}

export interface NovoCupomInput {
  lojaId: string;
  codigo: string;
  tipo: TipoCupom;
  valor: number;
  validade: string;
}

export async function criarCupom(input: NovoCupomInput): Promise<void> {
  if (!supabase) {
    useLojista.getState().addCupom(input);
    return;
  }
  const { error } = await supabase.from("cupons").insert({
    loja_id: input.lojaId,
    codigo: input.codigo.trim().toUpperCase(),
    tipo: input.tipo,
    valor: input.valor,
    validade: input.validade,
    ativo: true,
  });
  if (error) throw error;
}

export async function setCupomAtivo(
  cupomId: string,
  ativo: boolean,
): Promise<void> {
  if (!supabase) {
    useLojista.getState().toggleCupom(cupomId);
    return;
  }
  const { error } = await supabase
    .from("cupons")
    .update({ ativo })
    .eq("id", cupomId);
  if (error) throw error;
}

export async function excluirCupom(cupomId: string): Promise<void> {
  if (!supabase) {
    useLojista.getState().removeCupom(cupomId);
    return;
  }
  const { error } = await supabase.from("cupons").delete().eq("id", cupomId);
  if (error) throw error;
}

export async function listarPedidosDaLoja(lojaId: string): Promise<Pedido[]> {
  if (!supabase) return useLojista.getState().pedidos;
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, lojas(nome), itens_pedido(*)")
    .eq("loja_id", lojaId)
    .neq("status", "Aguardando pagamento") // só pedidos pagos aparecem para a loja
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPedido);
}

export async function atualizarStatusPedido(
  pedidoId: string,
  status: StatusPedido,
): Promise<void> {
  if (!supabase) {
    // Modo demo: atualiza o pedido no store do lojista.
    useLojista.setState((s) => ({
      pedidos: s.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, status } : p,
      ),
    }));
    return;
  }
  const { error } = await supabase
    .from("pedidos")
    .update({ status })
    .eq("id", pedidoId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════
// STORAGE — foto de produto
// ═══════════════════════════════════════════════════════════════

/** Faz upload da foto para o bucket `produtos` e retorna a URL pública. */
export async function uploadFotoProduto(file: File): Promise<string> {
  if (!supabase) {
    // Sem backend: usa um preview local (data URL).
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
      reader.readAsDataURL(file);
    });
  }
  const ext = file.name.split(".").pop() || "jpg";
  const caminho = `${Date.now()}-${Math.round(num(file.size))}.${ext}`;
  const { error } = await supabase.storage
    .from("produtos")
    .upload(caminho, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("produtos").getPublicUrl(caminho);
  return data.publicUrl;
}

import type { Categoria, Cupom, Endereco, Loja, Pedido, Produto } from "@/types";

// ─────────────────────────────────────────────────────────────
// Dados mock — Fase 1 e 2. Trocados por Supabase a partir da Fase 4.
// ─────────────────────────────────────────────────────────────

export const categorias: Categoria[] = [
  { id: "cimento", nome: "Cimento & Argamassa", emoji: "🧱" },
  { id: "tijolos", nome: "Tijolos & Blocos", emoji: "🟫" },
  { id: "tintas", nome: "Tintas", emoji: "🎨" },
  { id: "ferramentas", nome: "Ferramentas", emoji: "🔧" },
  { id: "eletrica", nome: "Elétrica", emoji: "💡" },
  { id: "hidraulica", nome: "Hidráulica", emoji: "🚰" },
  { id: "pisos", nome: "Pisos & Revestimentos", emoji: "🪟" },
  { id: "madeiras", nome: "Madeiras", emoji: "🪵" },
  { id: "telhas", nome: "Telhas", emoji: "🏠" },
  { id: "ferragens", nome: "Ferragens", emoji: "⚙️" },
  { id: "epi", nome: "EPI & Segurança", emoji: "🦺" },
  { id: "jardinagem", nome: "Jardinagem", emoji: "🌱" },
];

export const lojas: Loja[] = [
  {
    id: "deposito-central",
    nome: "Depósito Central",
    descricao: "Materiais básicos de construção, entrega rápida na obra.",
    logo: "🏗️",
    endereco: "Av. das Indústrias, 1200 — Centro",
    nota: 4.8,
    taxaEntrega: 0,
    tempoEstimado: "30-45 min",
    distanciaKm: 1.2,
    aberta: true,
    destaque: "Frete grátis acima de R$ 150",
  },
  {
    id: "casa-do-construtor",
    nome: "Casa do Construtor",
    descricao: "Tudo para o acabamento da sua obra.",
    logo: "🧰",
    endereco: "Rua Sete de Setembro, 458 — Bairro Alto",
    nota: 4.6,
    taxaEntrega: 9.9,
    tempoEstimado: "40-60 min",
    distanciaKm: 2.4,
    aberta: true,
    destaque: "10% OFF em tintas",
  },
  {
    id: "mega-materiais",
    nome: "Mega Materiais",
    descricao: "O maior estoque da região, preço de atacado.",
    logo: "🏬",
    endereco: "Rod. BR-101, km 12 — Distrito Industrial",
    nota: 4.9,
    taxaEntrega: 14.9,
    tempoEstimado: "50-70 min",
    distanciaKm: 5.1,
    aberta: true,
  },
  {
    id: "ferragens-silva",
    nome: "Ferragens Silva",
    descricao: "Ferramentas e ferragens com atendimento de bairro.",
    logo: "🔩",
    endereco: "Rua das Acácias, 77 — Vila Nova",
    nota: 4.3,
    taxaEntrega: 6.5,
    tempoEstimado: "25-40 min",
    distanciaKm: 0.8,
    aberta: false,
  },
];

export const produtos: Produto[] = [
  // Depósito Central
  {
    id: "p1",
    lojaId: "deposito-central",
    categoriaId: "cimento",
    nome: "Cimento CP-II 50kg",
    descricao: "Saco de cimento Portland composto, uso geral.",
    foto: "🧱",
    preco: 34.9,
    unidade: "saco 50kg",
    estoque: 240,
    desconto: 0,
    disponivel: true,
  },
  {
    id: "p2",
    lojaId: "deposito-central",
    categoriaId: "cimento",
    nome: "Argamassa AC-II 20kg",
    descricao: "Argamassa colante para áreas internas e externas.",
    foto: "🪣",
    preco: 19.9,
    unidade: "saco 20kg",
    estoque: 80,
    desconto: 10,
    disponivel: true,
  },
  {
    id: "p3",
    lojaId: "deposito-central",
    categoriaId: "tijolos",
    nome: "Tijolo Baiano 9 furos",
    descricao: "Bloco cerâmico 9x14x19 cm. Preço por unidade.",
    foto: "🟫",
    preco: 1.35,
    unidade: "un",
    estoque: 5000,
    desconto: 0,
    disponivel: true,
  },
  {
    id: "p4",
    lojaId: "deposito-central",
    categoriaId: "hidraulica",
    nome: "Tubo PVC 100mm 6m",
    descricao: "Tubo de esgoto série normal.",
    foto: "🚰",
    preco: 48.0,
    unidade: "barra 6m",
    estoque: 3,
    desconto: 0,
    disponivel: true,
  },
  {
    id: "p5",
    lojaId: "deposito-central",
    categoriaId: "cimento",
    nome: "Areia média lavada",
    descricao: "Saco de areia média para argamassa e concreto.",
    foto: "⏳",
    preco: 12.5,
    unidade: "saco 20kg",
    estoque: 0,
    desconto: 0,
    disponivel: true,
  },
  // Casa do Construtor
  {
    id: "p6",
    lojaId: "casa-do-construtor",
    categoriaId: "tintas",
    nome: "Tinta Acrílica Branca 18L",
    descricao: "Tinta acrílica fosca premium, alta cobertura.",
    foto: "🎨",
    preco: 289.9,
    unidade: "balde 18L",
    estoque: 25,
    desconto: 10,
    disponivel: true,
  },
  {
    id: "p7",
    lojaId: "casa-do-construtor",
    categoriaId: "pisos",
    nome: "Porcelanato Acetinado 60x60",
    descricao: "Caixa com 2,16 m². Bege acetinado.",
    foto: "🪟",
    preco: 79.9,
    unidade: "caixa 2,16m²",
    estoque: 60,
    desconto: 0,
    disponivel: true,
  },
  {
    id: "p8",
    lojaId: "casa-do-construtor",
    categoriaId: "ferramentas",
    nome: "Rolo de Lã 23cm + Bandeja",
    descricao: "Kit para pintura de paredes.",
    foto: "🖌️",
    preco: 24.9,
    unidade: "kit",
    estoque: 4,
    desconto: 0,
    disponivel: true,
  },
  {
    id: "p9",
    lojaId: "casa-do-construtor",
    categoriaId: "eletrica",
    nome: "Cabo Flexível 2,5mm 100m",
    descricao: "Rolo de cabo flexível 750V, antichama.",
    foto: "💡",
    preco: 159.0,
    unidade: "rolo 100m",
    estoque: 12,
    desconto: 5,
    disponivel: true,
  },
  // Mega Materiais
  {
    id: "p10",
    lojaId: "mega-materiais",
    categoriaId: "telhas",
    nome: "Telha Fibrocimento 2,44m",
    descricao: "Telha ondulada 6mm. Preço por unidade.",
    foto: "🏠",
    preco: 62.0,
    unidade: "un",
    estoque: 140,
    desconto: 0,
    disponivel: true,
  },
  {
    id: "p11",
    lojaId: "mega-materiais",
    categoriaId: "madeiras",
    nome: "Caibro Eucalipto 5x6 3m",
    descricao: "Madeira tratada para estrutura de telhado.",
    foto: "🪵",
    preco: 28.5,
    unidade: "peça 3m",
    estoque: 200,
    desconto: 20,
    disponivel: true,
  },
  {
    id: "p12",
    lojaId: "mega-materiais",
    categoriaId: "cimento",
    nome: "Cimento CP-V ARI 50kg",
    descricao: "Alta resistência inicial. Pallet com 40 sacos.",
    foto: "🧱",
    preco: 39.9,
    unidade: "saco 50kg",
    estoque: 1200,
    desconto: 0,
    disponivel: true,
  },
  {
    id: "p13",
    lojaId: "mega-materiais",
    categoriaId: "epi",
    nome: "Kit EPI Pedreiro",
    descricao: "Capacete, luvas, óculos e botina.",
    foto: "🦺",
    preco: 89.9,
    unidade: "kit",
    estoque: 30,
    desconto: 0,
    disponivel: true,
  },
  // Ferragens Silva
  {
    id: "p14",
    lojaId: "ferragens-silva",
    categoriaId: "ferramentas",
    nome: "Furadeira de Impacto 650W",
    descricao: "Furadeira com maleta e brocas.",
    foto: "🔧",
    preco: 219.0,
    unidade: "un",
    estoque: 8,
    desconto: 15,
    disponivel: true,
  },
  {
    id: "p15",
    lojaId: "ferragens-silva",
    categoriaId: "ferragens",
    nome: "Parafuso Bucha 8mm (100un)",
    descricao: "Caixa com 100 parafusos e buchas.",
    foto: "⚙️",
    preco: 32.0,
    unidade: "caixa 100un",
    estoque: 50,
    desconto: 0,
    disponivel: true,
  },
];

export const cupons: Cupom[] = [
  {
    id: "c1",
    lojaId: "deposito-central",
    codigo: "FRETEGRATIS",
    tipo: "frete",
    valor: 0,
    validade: "31/12/2026",
    ativo: true,
  },
  {
    id: "c2",
    lojaId: "deposito-central",
    codigo: "OBRA10",
    tipo: "percentual",
    valor: 10,
    validade: "31/12/2026",
    ativo: true,
  },
  {
    id: "c3",
    lojaId: "casa-do-construtor",
    codigo: "TINTA20",
    tipo: "fixo",
    valor: 20,
    validade: "30/09/2026",
    ativo: true,
  },
];

export const enderecos: Endereco[] = [
  {
    id: "e1",
    apelido: "Obra",
    rua: "Rua dos Pedreiros",
    numero: "340",
    complemento: "Lote 12",
    cidade: "Curitiba",
    cep: "80000-000",
  },
  {
    id: "e2",
    apelido: "Casa",
    rua: "Av. Brasil",
    numero: "1500",
    complemento: "Apto 202",
    cidade: "Curitiba",
    cep: "80010-100",
  },
];

// ─────────────────────────────────────────────────────────────
// Lado do lojista (Fase 2). Loja ativa do painel = "deposito-central".
// ─────────────────────────────────────────────────────────────

/** Loja "logada" no painel do lojista (mock da Fase 2/3). */
export const LOJA_ATIVA_ID = "deposito-central";

/** Pedidos recebidos pela loja ativa — seed do painel do lojista. */
export const pedidosLojistaSeed: Pedido[] = [
  {
    id: "5012",
    clienteId: "cli-1",
    clienteNome: "João Construtora",
    lojaId: LOJA_ATIVA_ID,
    lojaNome: "Depósito Central",
    itens: [
      { produtoId: "p1", nome: "Cimento CP-II 50kg", quantidade: 10, precoUnitario: 34.9 },
      { produtoId: "p3", nome: "Tijolo Baiano 9 furos", quantidade: 500, precoUnitario: 1.35 },
    ],
    status: "Novo",
    subtotal: 1024,
    frete: 0,
    desconto: 0,
    total: 1024,
    formaPagamento: "pix",
    enderecoResumo: "Rua dos Pedreiros, 340 — Obra",
    criadoEm: "2026-06-23T09:15:00",
  },
  {
    id: "5011",
    clienteId: "cli-2",
    clienteNome: "Maria Reformas",
    lojaId: LOJA_ATIVA_ID,
    lojaNome: "Depósito Central",
    itens: [
      { produtoId: "p2", nome: "Argamassa AC-II 20kg", quantidade: 8, precoUnitario: 17.91 },
    ],
    status: "Em preparo",
    subtotal: 143.28,
    frete: 9.9,
    desconto: 0,
    total: 153.18,
    formaPagamento: "cartao",
    enderecoResumo: "Av. Brasil, 1500 — Casa",
    criadoEm: "2026-06-23T08:40:00",
  },
  {
    id: "5009",
    clienteId: "cli-3",
    clienteNome: "Pedro Obras",
    lojaId: LOJA_ATIVA_ID,
    lojaNome: "Depósito Central",
    itens: [
      { produtoId: "p4", nome: "Tubo PVC 100mm 6m", quantidade: 6, precoUnitario: 48 },
    ],
    status: "A caminho",
    subtotal: 288,
    frete: 0,
    desconto: 0,
    total: 288,
    formaPagamento: "entrega",
    enderecoResumo: "Rua das Flores, 22 — Centro",
    criadoEm: "2026-06-23T07:50:00",
  },
  {
    id: "5004",
    clienteId: "cli-4",
    clienteNome: "Ana Construções",
    lojaId: LOJA_ATIVA_ID,
    lojaNome: "Depósito Central",
    itens: [
      { produtoId: "p1", nome: "Cimento CP-II 50kg", quantidade: 20, precoUnitario: 34.9 },
    ],
    status: "Entregue",
    subtotal: 698,
    frete: 0,
    desconto: 0,
    total: 698,
    formaPagamento: "pix",
    enderecoResumo: "Rod. BR-116, km 5 — Galpão",
    criadoEm: "2026-06-22T16:20:00",
  },
];

/** Vendas dos últimos 7 dias (seg→dom) para o gráfico do dashboard. */
export const vendasSemana: { dia: string; valor: number }[] = [
  { dia: "Seg", valor: 1240 },
  { dia: "Ter", valor: 980 },
  { dia: "Qua", valor: 1560 },
  { dia: "Qui", valor: 1320 },
  { dia: "Sex", valor: 2100 },
  { dia: "Sáb", valor: 2480 },
  { dia: "Dom", valor: 760 },
];

// ── Helpers de consulta sobre os mocks ──
export function getLoja(id: string): Loja | undefined {
  return lojas.find((l) => l.id === id);
}

export function getProduto(id: string): Produto | undefined {
  return produtos.find((p) => p.id === id);
}

export function produtosDaLoja(lojaId: string): Produto[] {
  return produtos.filter((p) => p.lojaId === lojaId);
}

export function cuponsDaLoja(lojaId: string): Cupom[] {
  return cupons.filter((c) => c.lojaId === lojaId && c.ativo);
}

/** Categorias que de fato têm produtos numa loja, na ordem de `categorias`. */
export function categoriasDaLoja(lojaId: string): Categoria[] {
  const ids = new Set(produtosDaLoja(lojaId).map((p) => p.categoriaId));
  return categorias.filter((c) => ids.has(c.id));
}

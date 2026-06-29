export type StatusPedido =
  | "Novo"
  | "Em preparo"
  | "Pronto"
  | "A caminho"
  | "Entregue"
  | "Concluído"
  | "Cancelado";

export type TipoUsuario = "cliente" | "lojista";

export type TipoCupom = "frete" | "percentual" | "fixo";

export type FormaPagamento = "pix" | "cartao" | "entrega";

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
}

export interface HorarioDia {
  dia: string; // "Seg", "Ter", ...
  aberto: boolean;
  abre: string; // "07:00"
  fecha: string; // "18:00"
}

export interface Loja {
  id: string;
  nome: string;
  descricao: string;
  logo: string; // emoji ou URL
  endereco: string;
  nota: number;
  taxaEntrega: number; // em reais; 0 = grátis
  tempoEstimado: string; // "30-45 min"
  distanciaKm?: number; // ausente até haver geolocalização (Fase futura)
  aberta: boolean;
  destaque?: string; // texto promocional opcional
  latitude?: number;
  longitude?: number;
  raioEntregaKm?: number;
  horario?: HorarioDia[];
  formasPagamento?: string[];
}

export interface Produto {
  id: string;
  lojaId: string;
  categoriaId: string;
  nome: string;
  descricao: string;
  foto: string; // emoji ou URL
  preco: number;
  unidade: string; // "saco 50kg", "un", "m²"
  estoque: number;
  desconto: number; // % de oferta (0 = sem desconto)
  disponivel: boolean;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface ItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  clienteNome?: string;
  lojaId: string;
  lojaNome: string;
  itens: ItemPedido[];
  status: StatusPedido;
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  formaPagamento: FormaPagamento;
  cupomCodigo?: string;
  enderecoResumo: string;
  criadoEm: string; // ISO
}

export interface Cupom {
  id: string;
  lojaId: string;
  codigo: string;
  tipo: TipoCupom;
  valor: number; // % para percentual, R$ para fixo, ignorado para frete
  validade: string;
  ativo: boolean;
}

export interface Endereco {
  id: string;
  apelido: string;
  rua: string;
  numero: string;
  complemento?: string;
  cidade: string;
  cep: string;
}

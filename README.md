# Construfácil

Marketplace de materiais de construção com entrega, inspirado no iFood. Dois lados no mesmo app: **cliente** (descobre lojas, monta carrinho, faz pedido) e **lojista** (recebe pedidos, gerencia catálogo e marketing). Interface em **português do Brasil**.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS · lucide-react
- Zustand (carrinho, sessão e pedidos persistidos em localStorage)
- Supabase (a partir da Fase 3)

## Como rodar

```bash
npm install
# (opcional nas Fases 1–2) criar .env.local a partir do exemplo:
# cp .env.local.example .env.local
npm run dev   # http://localhost:3000
```

> Variáveis de ambiente (Supabase) só são necessárias a partir da Fase 3.
> Sem elas o app roda normalmente com dados mock.

## Scripts

```bash
npm run dev      # desenvolvimento (localhost:3000)
npm run build    # build de produção
npm run start    # roda o build
npm run lint     # checagem de lint
```

## Status — Fase 1 concluída ✅

App do cliente completo, rodável com dados mock:

- **Login / Cadastro** (fake, sem backend) → define cliente/lojista
- **Home** — header com endereço e sacola, busca, categorias roláveis, banner,
  chips de filtro (entrega grátis, promoção, mais próximo, melhor avaliado) e
  lista de lojas
- **Loja / Catálogo** — capa, info, barra de progresso de frete grátis, busca
  interna, produtos por categoria com seletor de quantidade e botão
  "Ver sacola"
- **Sacola / Checkout** — itens com ajuste de quantidade, cupom, endereço,
  forma de pagamento e resumo recalculado ao vivo
- **Confirmação / Acompanhamento** — número do pedido e linha do tempo de status
- **Meus pedidos** — histórico
- **Perfil** — dados, atalhos e "Sou lojista"

Carrinho em Zustand, **por loja** (modelo iFood): adicionar item de outra loja
pergunta se deseja esvaziar o atual. Totais são derivados, nunca duplicados.

### Como testar o fluxo

1. `npm run dev` e abra http://localhost:3000
2. Faça login (qualquer e-mail/senha) → cai na Home
3. Escolha uma loja → adicione produtos (o botão "+" vira seletor de quantidade)
4. Toque em "Ver sacola" → ajuste itens, aplique o cupom `OBRA10` ou
   `FRETEGRATIS` (loja Depósito Central), escolha endereço e pagamento
5. "Finalizar pedido" → veja a confirmação com a linha do tempo
6. "Meus pedidos" mostra o histórico

## Fase 2 — Painel do lojista ✅

5 abas com mocks: dashboard (métricas + gráfico semanal + pedidos recentes),
pedidos (filtro + avanço de status), produtos (toggle de disponibilidade,
selo de oferta, aviso de estoque), novo produto (grava em memória), marketing
(cupons criar/ligar/excluir + ofertas por produto) e perfil da loja.

## Fase 3 — Supabase: banco e autenticação ✅

- **Schema completo** em [`supabase/schema.sql`](supabase/schema.sql): todas as
  tabelas, **RLS** com políticas (cliente vê só o que é dele; lojista gerencia só
  a própria loja; lojas/produtos/cupons são leitura pública), seed de categorias
  e trigger que cria o perfil no cadastro.
- **Autenticação real** (e-mail/senha + Google) via Supabase Auth, com
  roteamento por `tipo` (cliente → `/home`, lojista → `/lojista`) e proteção das
  rotas do lojista.
- **Plugável e com fallback:** sem `.env.local`, o app roda em **modo
  demonstração** (login e dados mock). Com as chaves, a autenticação real entra
  automaticamente. Passo a passo em [`supabase/README.md`](supabase/README.md).

## Fase 4 — Conectar dados reais ✅

- **Camada de dados** em [`lib/repo.ts`](lib/repo.ts): toda leitura/escrita passa por
  funções assíncronas que consultam o Supabase quando configurado e caem nos
  mocks/stores no modo demonstração. Inclui mappers (linha do banco → tipo do app,
  com coerção de `NUMERIC`).
- **Catálogo real**: home, loja e busca leem lojas/produtos/categorias do banco
  (cliente vê só produtos disponíveis).
- **Pedido real**: o checkout grava em `pedidos` + `itens_pedido`; histórico e
  acompanhamento leem do banco.
- **Painel do lojista** lê/grava produtos, cupons e pedidos reais; o status do
  pedido avança no banco. Uma loja padrão é criada automaticamente no primeiro
  acesso do lojista.
- **Upload de foto** do produto para o Storage (bucket `produtos`), com fallback
  para emoji/preview local no modo demo.
- Estados de **carregamento, vazio e erro** em todas as telas com dados.

> No modo demonstração a loja ativa (Depósito Central) é servida pelo store do
> lojista, então as duas pontas se enxergam: cadastrar um produto faz ele
> aparecer no app do cliente, e finalizar um pedido faz ele aparecer no painel.

## Fase 5 — Acabamento ✅

- **PWA instalável**: manifest ([`app/manifest.ts`](app/manifest.ts)), ícones da
  marca (`public/icons/`, gerados por [`scripts/gen-icons.mjs`](scripts/gen-icons.mjs)),
  `apple-touch-icon`, `theme-color` e **service worker** ([`public/sw.js`](public/sw.js))
  com cache do app shell (offline básico). O SW é registrado só em produção.
- **Tratamento de erros**: páginas [`error.tsx`](app/error.tsx) (boundary global) e
  [`not-found.tsx`](app/not-found.tsx) personalizadas; estados de carregamento/vazio/erro
  nas telas com dados (Fase 4).
- Pronto para **deploy na Vercel**.

### Regenerar os ícones

```bash
node scripts/gen-icons.mjs   # recria public/icons/* a partir do logo
```

### Instalar no celular

Abra o app publicado (HTTPS) no Chrome/Safari do celular → menu →
**"Adicionar à tela inicial"**. Ele abre em tela cheia, sem barra do navegador.

## Deploy na Vercel

1. Suba o projeto para um repositório Git (GitHub/GitLab).
2. Em <https://vercel.com> → **Add New → Project** → importe o repositório.
   A Vercel detecta Next.js automaticamente (sem configuração extra).
3. Em **Settings → Environment Variables**, adicione (se for usar Supabase):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy.** Depois, no Supabase → Authentication → URL Configuration, adicione
   a URL de produção e `https://SEU-APP.vercel.app/auth/callback` às Redirect URLs.

> Sem as variáveis, o deploy funciona em **modo demonstração** (dados mock).

## Estrutura

```
app/(cliente)/   telas do cliente (login, home, loja, sacola, pedido, pedidos, perfil)
app/lojista/     painel do lojista (placeholder — Fase 2)
components/      cliente/ · lojista/ · ui/
lib/             store (carrinho), pedidos, sessão, data (mocks), format, supabase
types/           tipos TypeScript
```

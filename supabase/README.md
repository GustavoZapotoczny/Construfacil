# Supabase — Construfácil (Fase 3)

Passo a passo para ligar o banco e a autenticação real. Enquanto não fizer isto,
o app roda em **modo demonstração** (dados e login mock das Fases 1–2).

## 1. Criar o projeto

1. Acesse <https://supabase.com> → **New project**.
2. Anote a **Project URL** e a **anon public key** (Settings → API).

## 2. Variáveis de ambiente

Na raiz do projeto, crie `.env.local` (a partir de `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Reinicie o `npm run dev` após criar/alterar o arquivo.

## 3. Rodar o schema

No painel do Supabase → **SQL Editor** → cole o conteúdo de
[`schema.sql`](./schema.sql) e execute. Ele cria todas as tabelas, ativa **RLS**
com as políticas (cliente vê só o que é dele; lojista gerencia só a própria loja;
lojas/produtos/cupons são leitura pública), popula as **categorias** e instala o
**trigger** que cria o perfil automaticamente a cada cadastro.

## 4. Autenticação

Authentication → **Providers**:

- **Email**: já vem ligado. Em desenvolvimento, é prático desativar
  "Confirm email" (Authentication → Providers → Email) para logar na hora.
  Se mantiver ligado, o cadastro pede confirmação por e-mail antes do acesso.
- **Google**: ative o provider e informe o Client ID/Secret do Google Cloud.
  - Em **Authentication → URL Configuration**, defina:
    - **Site URL**: `http://localhost:3000`
    - **Redirect URLs**: adicione `http://localhost:3000/auth/callback`
      (e a URL de produção quando publicar, ex.: `https://seu-app.vercel.app/auth/callback`).

## 5. Testar

- **Cadastro cliente**: `/cadastro` sem marcar "Sou lojista" → cai em `/home`.
- **Cadastro lojista**: marque "Sou lojista" → cai em `/lojista`. O painel passa
  a ser protegido: um cliente logado é redirecionado para fora dele.
- **Login**: `/login` com as credenciais → roteia conforme o `tipo` do perfil.

> O `tipo` (cliente/lojista) é gravado em `perfis` pelo trigger, a partir do
> metadado enviado no cadastro. Para promover um usuário a lojista manualmente:
> `update public.perfis set tipo = 'lojista' where id = '<uuid>';`

## Observação de arquitetura

A Fase 3 usa autenticação **no cliente** (supabase-js + sessão em localStorage),
coerente com o restante do app (Zustand). A **Fase 4** troca os mocks de dados
por queries reais a estas tabelas; a **Fase 5** cuida de PWA e deploy.

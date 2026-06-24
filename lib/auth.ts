import { supabase, supabaseConfigurado } from "@/lib/supabase";
import { useSessao } from "@/lib/sessao";
import type { TipoUsuario } from "@/types";

/** Auth real está disponível? (caso contrário, modo mock das Fases 1–2). */
export const authDisponivel = supabaseConfigurado;

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  tipo: TipoUsuario;
}

export interface ResultadoAuth {
  ok: boolean;
  /** Mensagem de erro amigável, se houver. */
  erro?: string;
  /** Tipo do usuário autenticado (define a rota de destino). */
  tipo?: TipoUsuario;
  /** true quando o cadastro exige confirmação de e-mail antes do login. */
  precisaConfirmarEmail?: boolean;
}

/**
 * Carrega o perfil (nome, tipo) do usuário logado no Supabase e
 * espelha em `useSessao`. Retorna o tipo, ou null se não houver sessão.
 */
export async function sincronizarSessao(): Promise<TipoUsuario | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    useSessao.getState().sair();
    return null;
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, tipo")
    .eq("id", user.id)
    .single();

  const tipo = (perfil?.tipo as TipoUsuario) ?? "cliente";
  useSessao.getState().entrar({
    nome: perfil?.nome ?? user.email?.split("@")[0] ?? "Usuário",
    email: user.email ?? "",
    tipo,
  });
  return tipo;
}

/** Cadastro com e-mail/senha. Em modo mock, apenas grava a sessão local. */
export async function cadastrar(dados: DadosCadastro): Promise<ResultadoAuth> {
  if (!supabase) {
    useSessao.getState().entrar({
      nome: dados.nome || "Novo usuário",
      email: dados.email,
      tipo: dados.tipo,
    });
    return { ok: true, tipo: dados.tipo };
  }

  const { data, error } = await supabase.auth.signUp({
    email: dados.email,
    password: dados.senha,
    options: {
      data: { nome: dados.nome, telefone: dados.telefone, tipo: dados.tipo },
    },
  });
  if (error) return { ok: false, erro: traduzErro(error.message) };

  // Se a confirmação de e-mail estiver ativa, ainda não há sessão.
  if (!data.session) {
    return { ok: true, tipo: dados.tipo, precisaConfirmarEmail: true };
  }
  const tipo = (await sincronizarSessao()) ?? dados.tipo;
  return { ok: true, tipo };
}

/** Login com e-mail/senha. Em modo mock, aceita qualquer credencial. */
export async function entrar(
  email: string,
  senha: string,
): Promise<ResultadoAuth> {
  if (!supabase) {
    useSessao.getState().entrar({
      nome: email.split("@")[0] || "Cliente",
      email: email || "cliente@construfacil.app",
      tipo: "cliente",
    });
    return { ok: true, tipo: "cliente" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) return { ok: false, erro: traduzErro(error.message) };

  const tipo = (await sincronizarSessao()) ?? "cliente";
  return { ok: true, tipo };
}

/** Login social com Google (redireciona para /auth/callback). */
export async function entrarComGoogle(): Promise<ResultadoAuth> {
  if (!supabase) {
    // Sem backend: simula um cliente.
    useSessao.getState().entrar({
      nome: "Cliente Google",
      email: "cliente@gmail.com",
      tipo: "cliente",
    });
    return { ok: true, tipo: "cliente" };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined,
    },
  });
  if (error) return { ok: false, erro: traduzErro(error.message) };
  return { ok: true }; // o navegador será redirecionado
}

/** Encerra a sessão (Supabase + estado local). */
export async function sair(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  useSessao.getState().sair();
}

/** Traduz mensagens comuns do Supabase para pt-BR. */
function traduzErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "Este e-mail já está cadastrado.";
  if (m.includes("password")) return "Senha inválida (mínimo 6 caracteres).";
  if (m.includes("email")) return "E-mail inválido.";
  return "Não foi possível concluir. Tente novamente.";
}

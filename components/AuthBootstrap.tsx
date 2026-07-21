"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sincronizarSessao } from "@/lib/auth";
import { useSessao } from "@/lib/sessao";

// Telas que NÃO exigem sessão (não redirecionamos delas).
const ROTAS_PUBLICAS = ["/login", "/cadastro", "/auth"];
function ehPublica(path: string): boolean {
  return ROTAS_PUBLICAS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * - Restaura/sincroniza a sessão do Supabase com o `useSessao`.
 * - Se a sessão do Supabase morreu (expirou) mas a tela ainda aparece
 *   "logada", manda o usuário para o /login (com aviso) em vez de deixá-lo
 *   preso numa tela onde nada salva. Em modo mock (sem Supabase) não faz nada.
 */
export function AuthBootstrap() {
  const router = useRouter();
  const pathname = usePathname();

  // 1) Sincroniza o perfil e reage a mudanças de autenticação.
  useEffect(() => {
    if (!supabase) return;
    sincronizarSessao().catch(() => {});
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        useSessao.getState().sair();
        if (!ehPublica(window.location.pathname)) router.replace("/login");
      } else {
        sincronizarSessao().catch(() => {});
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  // 2) A cada navegação para uma tela que exige login, confere se há sessão
  //    válida. Se não há (expirou), avisa e leva ao /login.
  useEffect(() => {
    if (!supabase || ehPublica(pathname)) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return;
      const estavaLogado = !!useSessao.getState().usuario;
      useSessao.getState().sair();
      if (estavaLogado) {
        try {
          sessionStorage.setItem("sessao-expirada", "1");
        } catch {
          /* sem sessionStorage: só redireciona */
        }
      }
      router.replace("/login");
    });
  }, [pathname, router]);

  return null;
}

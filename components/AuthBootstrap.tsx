"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sincronizarSessao } from "@/lib/auth";
import { useSessao } from "@/lib/sessao";

// Telas que EXIGEM sessão. O resto do app (vitrine, loja, produto, sacola,
// assistente) é livre para navegar sem login — o login só é obrigatório ao
// finalizar a compra (tratado na sacola) e nestas telas pessoais.
const ROTAS_PROTEGIDAS = ["/pedidos", "/pedido", "/perfil", "/lojista", "/admin"];
function ehProtegida(path: string): boolean {
  return ROTAS_PROTEGIDAS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * - Restaura/sincroniza a sessão do Supabase com o `useSessao` (para o app
 *   saber quem está logado durante a navegação livre).
 * - Nas telas PROTEGIDAS, se não há sessão válida (nunca logou ou expirou),
 *   manda para o /login — voltando para a tela de origem depois (?next=).
 *   Em modo mock (sem Supabase) não faz nada.
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
        // Só expulsa se estiver numa tela que exige login.
        if (ehProtegida(window.location.pathname)) router.replace("/login");
      } else {
        sincronizarSessao().catch(() => {});
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  // 2) Ao entrar numa tela PROTEGIDA sem sessão válida, leva ao /login
  //    (guardando o destino para voltar depois do login).
  useEffect(() => {
    if (!supabase || !ehProtegida(pathname)) return;
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
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    });
  }, [pathname, router]);

  return null;
}

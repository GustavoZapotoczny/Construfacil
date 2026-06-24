"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sincronizarSessao } from "@/lib/auth";

/**
 * Restaura a sessão do Supabase no carregamento e mantém o `useSessao`
 * sincronizado com mudanças de autenticação. Em modo mock (sem Supabase
 * configurado) não faz nada — o login fake cuida do estado local.
 */
export function AuthBootstrap() {
  useEffect(() => {
    if (!supabase) return;

    sincronizarSessao();
    const { data } = supabase.auth.onAuthStateChange(() => {
      sincronizarSessao();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}

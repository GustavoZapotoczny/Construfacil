"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sincronizarSessao } from "@/lib/auth";

/**
 * Destino do redirecionamento do login social (Google).
 * Troca o código por sessão (PKCE), descobre o tipo e roteia.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function concluir() {
      if (!supabase) {
        router.replace("/login");
        return;
      }
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const tipo = await sincronizarSessao();
        router.replace(tipo === "lojista" ? "/lojista" : "/home");
      } catch {
        setErro("Não foi possível concluir o login. Tente novamente.");
      }
    }
    concluir();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-8 text-center">
      {erro ? (
        <>
          <p className="text-sm text-red-600">{erro}</p>
          <button
            onClick={() => router.replace("/login")}
            className="font-semibold text-orange-600"
          >
            Voltar ao login
          </button>
        </>
      ) : (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
          <p className="text-sm text-stone-500">Entrando…</p>
        </>
      )}
    </div>
  );
}

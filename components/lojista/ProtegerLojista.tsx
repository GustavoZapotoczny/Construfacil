"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authDisponivel, sincronizarSessao } from "@/lib/auth";

type Estado = "verificando" | "ok" | "negado";

/**
 * Garante que apenas usuários do tipo "lojista" acessem o painel.
 * Só atua quando o Supabase está configurado; no modo demonstração
 * (Fases 1–2) o painel permanece acessível para visualização.
 */
export function ProtegerLojista({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>(
    authDisponivel ? "verificando" : "ok",
  );

  useEffect(() => {
    if (!authDisponivel) return;
    let ativo = true;
    sincronizarSessao().then((tipo) => {
      if (!ativo) return;
      if (tipo === "lojista") {
        setEstado("ok");
      } else {
        setEstado("negado");
        router.replace(tipo ? "/home" : "/login");
      }
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  if (estado === "ok") return <>{children}</>;
  if (estado === "negado") return null;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
    </div>
  );
}

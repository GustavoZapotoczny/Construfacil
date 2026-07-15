"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessao } from "@/lib/sessao";
import { useMontado } from "@/lib/useMontado";
import { ehAdmin } from "@/lib/adminData";
import { AdminNav } from "@/components/admin/AdminNav";
import { ShieldAlert } from "lucide-react";

/**
 * Área do administrador da plataforma. Só o e-mail admin entra; qualquer
 * outro é barrado (e as rotas de API também validam no servidor). A checagem
 * aqui é só de experiência — a proteção real é no servidor.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const usuario = useSessao((s) => s.usuario);
  const montado = useMontado();
  const autorizado = ehAdmin(usuario?.email);

  useEffect(() => {
    if (montado && !usuario) router.replace("/login");
  }, [montado, usuario, router]);

  if (!montado) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-400">
        Carregando…
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-lg font-bold text-stone-800">Acesso restrito</h1>
        <p className="text-sm text-stone-500">
          Esta área é exclusiva do administrador da plataforma.
        </p>
        <button
          onClick={() => router.replace("/home")}
          className="mt-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-4">{children}</main>
    </div>
  );
}

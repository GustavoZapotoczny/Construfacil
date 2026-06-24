"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Cabeçalho simples com voltar + título para subpáginas. */
export function PageHeader({ titulo }: { titulo: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-100 bg-white px-4 py-3 pt-12">
      <button onClick={() => router.back()} aria-label="Voltar">
        <ArrowLeft size={22} className="text-stone-700" />
      </button>
      <h1 className="font-bold text-stone-800">{titulo}</h1>
    </header>
  );
}

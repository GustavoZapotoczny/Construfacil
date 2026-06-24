"use client";

import type { Categoria } from "@/types";
import { clsx } from "@/lib/cx";

interface Props {
  categoria: Categoria;
  ativa: boolean;
  onClick: () => void;
}

export function CategoriaCirculo({ categoria, ativa, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-16 shrink-0 flex-col items-center gap-1"
    >
      <span
        className={clsx(
          "flex h-14 w-14 items-center justify-center rounded-full text-2xl transition",
          ativa
            ? "bg-orange-500 ring-2 ring-orange-200"
            : "bg-white border border-stone-100 shadow-sm",
        )}
      >
        {categoria.emoji}
      </span>
      <span
        className={clsx(
          "text-center text-[11px] leading-tight",
          ativa ? "font-semibold text-orange-600" : "text-stone-600",
        )}
      >
        {categoria.nome.split(" ")[0]}
      </span>
    </button>
  );
}

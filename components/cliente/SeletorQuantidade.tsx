"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { clsx } from "@/lib/cx";

interface Props {
  quantidade: number;
  onIncrementar: () => void;
  onDecrementar: () => void;
  /** Mostra lixeira no lugar do "−" quando quantidade chega a 1. */
  lixeiraNoUm?: boolean;
  tamanho?: "sm" | "md";
}

export function SeletorQuantidade({
  quantidade,
  onIncrementar,
  onDecrementar,
  lixeiraNoUm = false,
  tamanho = "md",
}: Props) {
  const noUm = lixeiraNoUm && quantidade === 1;
  const btn =
    tamanho === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 p-1">
      <button
        type="button"
        onClick={onDecrementar}
        aria-label={noUm ? "Remover item" : "Diminuir quantidade"}
        className={clsx(
          "flex items-center justify-center rounded-full bg-white text-orange-600 shadow-sm transition active:scale-95",
          btn,
        )}
      >
        {noUm ? <Trash2 size={15} /> : <Minus size={16} />}
      </button>
      <span className="min-w-5 text-center text-sm font-semibold text-stone-800">
        {quantidade}
      </span>
      <button
        type="button"
        onClick={onIncrementar}
        aria-label="Aumentar quantidade"
        className={clsx(
          "flex items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition active:scale-95",
          btn,
        )}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

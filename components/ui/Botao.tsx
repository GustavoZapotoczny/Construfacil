import { clsx } from "@/lib/cx";
import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "fantasma";

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  bloco?: boolean; // largura total
}

const variantes: Record<Variante, string> = {
  primario:
    "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-stone-300 disabled:text-stone-500",
  secundario:
    "bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50",
  fantasma:
    "bg-transparent text-stone-600 hover:bg-stone-100 disabled:opacity-50",
};

export function Botao({
  variante = "primario",
  bloco = false,
  className,
  children,
  ...props
}: BotaoProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed",
        variantes[variante],
        bloco && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

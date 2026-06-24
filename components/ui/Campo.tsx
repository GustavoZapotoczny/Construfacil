import { clsx } from "@/lib/cx";
import type { InputHTMLAttributes, ReactNode } from "react";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  iconeEsquerda?: ReactNode;
  acaoDireita?: ReactNode;
}

export function Campo({
  label,
  iconeEsquerda,
  acaoDireita,
  className,
  id,
  ...props
}: CampoProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-stone-700">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
        {iconeEsquerda && (
          <span className="text-stone-400">{iconeEsquerda}</span>
        )}
        <input
          id={id}
          className={clsx(
            "w-full bg-transparent py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none",
            className,
          )}
          {...props}
        />
        {acaoDireita}
      </div>
    </label>
  );
}

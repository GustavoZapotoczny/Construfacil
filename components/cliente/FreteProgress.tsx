import { Bike, Check } from "lucide-react";
import { brl } from "@/lib/format";
import { clsx } from "@/lib/cx";

interface Props {
  subtotal: number;
  /** valor mínimo para frete grátis */
  minimo: number;
}

export function FreteProgress({ subtotal, minimo }: Props) {
  const atingiu = subtotal >= minimo;
  const pct = Math.min(100, minimo > 0 ? (subtotal / minimo) * 100 : 100);
  const falta = Math.max(0, minimo - subtotal);

  return (
    <div className="rounded-xl bg-white p-3">
      <div className="flex items-center gap-2 text-sm">
        {atingiu ? (
          <Check size={16} className="text-green-600" />
        ) : (
          <Bike size={16} className="text-orange-500" />
        )}
        <span className={clsx(atingiu ? "text-green-700" : "text-stone-600")}>
          {atingiu ? (
            <span className="font-semibold">Você ganhou frete grátis! 🎉</span>
          ) : (
            <>
              Faltam <span className="font-semibold">{brl(falta)}</span> para o
              frete grátis
            </>
          )}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            atingiu ? "bg-green-500" : "bg-orange-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

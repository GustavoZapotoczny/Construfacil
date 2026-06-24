import Link from "next/link";
import { Star, Clock, Bike } from "lucide-react";
import type { Loja } from "@/types";
import { brl, distancia } from "@/lib/format";
import { FotoProduto } from "@/components/ui/FotoProduto";
import { clsx } from "@/lib/cx";

export function LojaCard({ loja }: { loja: Loja }) {
  const freteGratis = loja.taxaEntrega === 0;

  return (
    <Link
      href={`/loja/${loja.id}`}
      className={clsx(
        "flex gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm transition active:scale-[0.99]",
        !loja.aberta && "opacity-60",
      )}
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 text-3xl">
        <FotoProduto foto={loja.logo} alt={loja.nome} emojiClassName="text-3xl" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold text-stone-800">{loja.nome}</h3>
          <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-stone-700">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {loja.nota.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
          </span>
        </div>
        <p className="truncate text-xs text-stone-500">{loja.descricao}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Clock size={13} /> {loja.tempoEstimado}
          </span>
          {distancia(loja.distanciaKm) && <span>{distancia(loja.distanciaKm)}</span>}
          <span
            className={clsx(
              "flex items-center gap-1",
              freteGratis && "font-semibold text-green-600",
            )}
          >
            <Bike size={13} />
            {freteGratis ? "Grátis" : brl(loja.taxaEntrega)}
          </span>
        </div>
        {!loja.aberta && (
          <span className="mt-1.5 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
            Fechada agora
          </span>
        )}
      </div>
    </Link>
  );
}

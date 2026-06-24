import { brl } from "@/lib/format";

interface Props {
  dados: { dia: string; valor: number }[];
}

export function GraficoBarras({ dados }: Props) {
  const max = Math.max(...dados.map((d) => d.valor), 1);

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
      <div className="flex items-end justify-between gap-2">
        {dados.map((d) => {
          const altura = Math.round((d.valor / max) * 100);
          return (
            <div key={d.dia} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-stone-400">
                {(d.valor / 1000).toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}
                k
              </span>
              <div className="flex h-28 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-orange-500 to-amber-400"
                  style={{ height: `${Math.max(6, altura)}%` }}
                  title={brl(d.valor)}
                />
              </div>
              <span className="text-[11px] text-stone-500">{d.dia}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

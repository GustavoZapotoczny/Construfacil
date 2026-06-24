import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  rotulo: string;
  valor: string;
  variacao?: string;
}

export function MetricCard({ icon: Icon, rotulo, valor, variacao }: Props) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-3.5 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Icon size={18} />
      </div>
      <p className="mt-2 text-lg font-bold leading-tight text-stone-800">
        {valor}
      </p>
      <p className="text-xs text-stone-500">{rotulo}</p>
      {variacao && (
        <p className="mt-0.5 text-[11px] font-medium text-green-600">
          {variacao}
        </p>
      )}
    </div>
  );
}

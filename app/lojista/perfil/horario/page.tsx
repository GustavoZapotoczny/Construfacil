"use client";

import { useEffect, useState } from "react";
import { getMinhaLoja, atualizarLoja } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { SubHeader } from "@/components/lojista/SubHeader";
import { Toggle } from "@/components/ui/Toggle";
import { Botao } from "@/components/ui/Botao";
import { Carregando } from "@/components/ui/Estados";
import { clsx } from "@/lib/cx";
import type { HorarioDia } from "@/types";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function padrao(): HorarioDia[] {
  return DIAS.map((dia) => ({
    dia,
    aberto: dia !== "Dom",
    abre: "07:00",
    fecha: "18:00",
  }));
}

export default function HorarioPage() {
  const { data: loja, loading } = useAsync(getMinhaLoja, []);
  const [horario, setHorario] = useState<HorarioDia[]>(padrao());
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (loja?.horario && loja.horario.length) setHorario(loja.horario);
  }, [loja]);

  function atualizar(i: number, patch: Partial<HorarioDia>) {
    setHorario((h) => h.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    setOk(false);
  }

  async function salvar() {
    if (!loja) return;
    setSalvando(true);
    setOk(false);
    try {
      await atualizarLoja(loja.id, { horario });
      setOk(true);
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <Carregando />;

  return (
    <div className="min-h-screen pb-28">
      <SubHeader titulo="Horário de funcionamento" />

      <div className="flex flex-col gap-2 px-4 pt-4">
        {horario.map((d, i) => (
          <div
            key={d.dia}
            className={clsx(
              "flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3",
              !d.aberto && "opacity-60",
            )}
          >
            <span className="w-10 text-sm font-semibold text-stone-700">
              {d.dia}
            </span>
            {d.aberto ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="time"
                  value={d.abre}
                  onChange={(e) => atualizar(i, { abre: e.target.value })}
                  className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
                />
                <span className="text-stone-400">às</span>
                <input
                  type="time"
                  value={d.fecha}
                  onChange={(e) => atualizar(i, { fecha: e.target.value })}
                  className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
            ) : (
              <span className="flex-1 text-sm text-stone-400">Fechado</span>
            )}
            <Toggle
              ligado={d.aberto}
              onChange={(v) => atualizar(i, { aberto: v })}
              label={`Abrir ${d.dia}`}
            />
          </div>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-100 bg-white p-4 md:left-60 md:max-w-6xl">
        {ok && (
          <p className="mb-2 text-center text-xs font-medium text-green-600">
            Horário salvo! ✓
          </p>
        )}
        <Botao bloco onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar horário"}
        </Botao>
      </div>
    </div>
  );
}

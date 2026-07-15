"use client";

import { useState } from "react";
import {
  carregarRepasses,
  registrarRepasse,
  type AdminRepasse,
} from "@/lib/adminData";
import { useAsync } from "@/lib/useAsync";
import { Carregando, ErroCarregar } from "@/components/ui/Estados";
import { brl } from "@/lib/format";
import { Wallet, Check, Info } from "lucide-react";

export default function RepassesPage() {
  const { data, loading, error, reload } = useAsync(carregarRepasses, []);
  const [processando, setProcessando] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [erroAcao, setErroAcao] = useState("");

  async function repassar(loja: AdminRepasse) {
    setErroAcao("");
    setAviso("");
    setProcessando(loja.id);
    try {
      const r = await registrarRepasse(loja.id);
      setAviso(
        `Repasse de ${brl(r.valor)} para ${loja.nome} registrado (${r.repassados} pedido(s)).`,
      );
      reload();
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setProcessando(null);
    }
  }

  if (loading) return <Carregando texto="Carregando repasses…" />;
  if (error) return <ErroCarregar onRetry={reload} />;

  const repasses = data ?? [];
  const totalARepassar = repasses.reduce((s, r) => s + r.aRepassar, 0);
  const comPendencia = repasses.filter((r) => r.qtdARepassar > 0);
  const semPendencia = repasses.filter((r) => r.qtdARepassar === 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-stone-800">Repasses</h1>
        <p className="text-sm text-stone-500">
          Valor liberado (cliente confirmou o recebimento) a repassar para cada loja.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs font-medium text-emerald-700">Total a repassar</p>
        <p className="text-2xl font-bold text-emerald-800">{brl(totalARepassar)}</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-stone-100 bg-white p-4 text-xs text-stone-500">
        <Info size={16} className="mt-0.5 shrink-0 text-stone-400" />
        <p>
          Marcar como repassado é só um <strong>registro</strong> — a transferência
          do dinheiro para a loja você faz na sua conta do{" "}
          <span className="font-medium text-stone-700">Mercado Pago</span>. Depois de
          transferir, toque em “Marcar repassado” para dar baixa aqui.
        </p>
      </div>

      {aviso && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {aviso}
        </p>
      )}
      {erroAcao && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{erroAcao}</p>
      )}

      {comPendencia.length === 0 ? (
        <div className="rounded-2xl border border-stone-100 bg-white p-8 text-center text-sm text-stone-500">
          Nenhum repasse pendente. 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {comPendencia.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl">
                  {r.logo?.startsWith("http") ? "🏪" : r.logo}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-800">{r.nome}</p>
                  <p className="text-xs text-stone-500">
                    {r.qtdARepassar} pedido(s) · já repassado {brl(r.jaRepassado)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <p className="font-bold text-emerald-700">{brl(r.aRepassar)}</p>
                <button
                  onClick={() => repassar(r)}
                  disabled={processando === r.id}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  <Check size={14} />
                  {processando === r.id ? "Registrando…" : "Marcar repassado"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lojas já quitadas (histórico) */}
      {semPendencia.some((r) => r.jaRepassado > 0) && (
        <div>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-stone-500">
            Já repassado (sem pendências)
          </h2>
          <div className="divide-y divide-stone-100 rounded-2xl border border-stone-100 bg-white">
            {semPendencia
              .filter((r) => r.jaRepassado > 0)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="flex items-center gap-2 text-stone-700">
                    <Wallet size={15} className="text-stone-400" />
                    {r.nome}
                  </span>
                  <span className="font-medium text-stone-500">
                    {brl(r.jaRepassado)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

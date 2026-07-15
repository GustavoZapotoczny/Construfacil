"use client";

import { Suspense, useEffect, useState } from "react";
import { QrCode, CreditCard, Landmark, Banknote } from "lucide-react";
import { getMinhaLoja, atualizarLoja } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { SubHeader } from "@/components/lojista/SubHeader";
import { Toggle } from "@/components/ui/Toggle";
import { Botao } from "@/components/ui/Botao";
import { Carregando } from "@/components/ui/Estados";
import { ConectarMercadoPago } from "@/components/lojista/ConectarMercadoPago";

const OPCOES = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "credito", label: "Cartão de crédito", icon: CreditCard },
  { id: "debito", label: "Cartão de débito", icon: Landmark },
  { id: "dinheiro", label: "Dinheiro na entrega", icon: Banknote },
];

export default function PagamentoPage() {
  const { data: loja, loading } = useAsync(getMinhaLoja, []);
  const [aceitos, setAceitos] = useState<string[]>(["pix", "credito", "dinheiro"]);
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (loja?.formasPagamento) setAceitos(loja.formasPagamento);
  }, [loja]);

  function alternar(id: string, ligado: boolean) {
    setOk(false);
    setAceitos((a) =>
      ligado ? (a.includes(id) ? a : [...a, id]) : a.filter((x) => x !== id),
    );
  }

  async function salvar() {
    if (!loja) return;
    setSalvando(true);
    setOk(false);
    try {
      await atualizarLoja(loja.id, { formas_pagamento: aceitos });
      setOk(true);
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <Carregando />;

  return (
    <div className="min-h-screen pb-28">
      <SubHeader titulo="Formas de pagamento" />

      <Suspense fallback={null}>
        <ConectarMercadoPago />
      </Suspense>

      <p className="px-4 pt-6 text-sm text-stone-500">
        Selecione as formas que sua loja aceita na entrega.
      </p>

      <div className="flex flex-col gap-2 px-4 pt-3">
        {OPCOES.map(({ id, label, icon: Icon }) => {
          const ligado = aceitos.includes(id);
          return (
            <div
              key={id}
              className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3.5"
            >
              <Icon size={20} className={ligado ? "text-orange-600" : "text-stone-400"} />
              <span className="flex-1 text-sm font-medium text-stone-700">
                {label}
              </span>
              <Toggle ligado={ligado} onChange={(v) => alternar(id, v)} label={label} />
            </div>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-100 bg-white p-4 md:left-60 md:max-w-6xl">
        {ok && (
          <p className="mb-2 text-center text-xs font-medium text-green-600">
            Formas de pagamento salvas! ✓
          </p>
        )}
        <Botao bloco onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Botao>
      </div>
    </div>
  );
}

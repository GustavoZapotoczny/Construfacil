"use client";

import { Check, QrCode, CreditCard, Banknote } from "lucide-react";
import { usePreferencias } from "@/lib/preferencias";
import { PageHeader } from "@/components/ui/PageHeader";
import { clsx } from "@/lib/cx";
import type { FormaPagamento } from "@/types";

const OPCOES: { id: FormaPagamento; label: string; desc: string; icon: typeof QrCode }[] = [
  { id: "pix", label: "Pix", desc: "Pagamento na hora, sem taxas", icon: QrCode },
  { id: "cartao", label: "Cartão", desc: "Crédito ou débito na entrega", icon: CreditCard },
  { id: "entrega", label: "Dinheiro na entrega", desc: "Pague ao receber", icon: Banknote },
];

export default function PagamentoClientePage() {
  const padrao = usePreferencias((s) => s.pagamentoPadrao);
  const setPadrao = usePreferencias((s) => s.setPagamentoPadrao);

  return (
    <div className="min-h-screen pb-10">
      <PageHeader titulo="Formas de pagamento" />

      <p className="px-4 pt-4 text-sm text-stone-500">
        Escolha sua forma de pagamento padrão — ela vem pré-selecionada no
        checkout.
      </p>

      <div className="flex flex-col gap-2 px-4 pt-3">
        {OPCOES.map(({ id, label, desc, icon: Icon }) => {
          const ativo = padrao === id;
          return (
            <button
              key={id}
              onClick={() => setPadrao(id)}
              className={clsx(
                "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition",
                ativo ? "border-orange-500 bg-orange-50" : "border-stone-100 bg-white",
              )}
            >
              <Icon size={22} className={ativo ? "text-orange-600" : "text-stone-400"} />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-stone-800">
                  {label}
                </span>
                <span className="text-xs text-stone-500">{desc}</span>
              </span>
              <span
                className={clsx(
                  "flex h-5 w-5 items-center justify-center rounded-full border",
                  ativo ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300",
                )}
              >
                {ativo && <Check size={12} />}
              </span>
            </button>
          );
        })}
      </div>

      <p className="px-4 pt-4 text-[11px] text-stone-400">
        Nesta versão o pagamento é combinado na entrega com a loja — não
        armazenamos dados de cartão. A integração com pagamento online entra numa
        próxima fase.
      </p>
    </div>
  );
}

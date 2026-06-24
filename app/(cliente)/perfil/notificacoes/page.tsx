"use client";

import { Package, Tag } from "lucide-react";
import { usePreferencias } from "@/lib/preferencias";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toggle } from "@/components/ui/Toggle";

export default function NotificacoesPage() {
  const { notifPedidos, notifPromocoes, setNotif } = usePreferencias();

  const itens = [
    {
      icon: Package,
      label: "Atualizações de pedidos",
      desc: "Avisos quando o status do pedido muda",
      chave: "notifPedidos" as const,
      valor: notifPedidos,
    },
    {
      icon: Tag,
      label: "Ofertas e promoções",
      desc: "Novidades e cupons das lojas",
      chave: "notifPromocoes" as const,
      valor: notifPromocoes,
    },
  ];

  return (
    <div className="min-h-screen pb-10">
      <PageHeader titulo="Notificações" />
      <div className="flex flex-col gap-2 px-4 pt-4">
        {itens.map(({ icon: Icon, label, desc, chave, valor }) => (
          <div
            key={chave}
            className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3.5"
          >
            <Icon size={20} className={valor ? "text-orange-600" : "text-stone-400"} />
            <span className="flex-1">
              <span className="block text-sm font-medium text-stone-800">{label}</span>
              <span className="text-xs text-stone-500">{desc}</span>
            </span>
            <Toggle ligado={valor} onChange={(v) => setNotif(chave, v)} label={label} />
          </div>
        ))}
      </div>
    </div>
  );
}

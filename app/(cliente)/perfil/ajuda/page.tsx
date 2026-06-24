"use client";

import { Mail, MessageCircle, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

const FAQ = [
  {
    q: "Como acompanho meu pedido?",
    a: "Em 'Pedidos', toque no pedido para ver a linha do tempo do status (recebido, em preparo, a caminho, entregue).",
  },
  {
    q: "Posso comprar de mais de uma loja no mesmo pedido?",
    a: "Não. O carrinho é por loja — ao adicionar item de outra loja, o app pergunta se deseja esvaziar o atual.",
  },
  {
    q: "Como aplico um cupom?",
    a: "Na sacola, digite o código no campo 'Cupom de desconto' e toque em Aplicar.",
  },
  {
    q: "Como mudo meu endereço de entrega?",
    a: "Em Perfil → Endereços você cadastra e edita seus endereços; escolha o de entrega no checkout.",
  },
];

export default function AjudaPage() {
  return (
    <div className="min-h-screen pb-10">
      <PageHeader titulo="Ajuda e suporte" />

      <div className="px-4 pt-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
          <HelpCircle size={16} /> Perguntas frequentes
        </h2>
        <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white">
          {FAQ.map((item, i) => (
            <details
              key={item.q}
              className={i > 0 ? "border-t border-stone-100" : ""}
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-stone-800">
                {item.q}
              </summary>
              <p className="px-4 pb-3 text-sm text-stone-500">{item.a}</p>
            </details>
          ))}
        </div>

        <h2 className="mb-2 mt-5 text-sm font-semibold text-stone-700">
          Fale com a gente
        </h2>
        <div className="flex flex-col gap-2">
          <a
            href="mailto:suporte@construfacil.app"
            className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3.5"
          >
            <Mail size={20} className="text-orange-600" />
            <span className="flex-1 text-sm font-medium text-stone-700">
              suporte@construfacil.app
            </span>
          </a>
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3.5"
          >
            <MessageCircle size={20} className="text-green-600" />
            <span className="flex-1 text-sm font-medium text-stone-700">
              WhatsApp de suporte
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

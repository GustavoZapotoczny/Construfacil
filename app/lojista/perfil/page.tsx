"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  CreditCard,
  MapPin,
  BarChart3,
  Smartphone,
  LogOut,
  ChevronRight,
  Star,
  Store,
} from "lucide-react";
import { getMinhaLoja, setLojaAberta } from "@/lib/repo";
import { sair } from "@/lib/auth";
import { useAsync } from "@/lib/useAsync";
import { Toggle } from "@/components/ui/Toggle";
import { FotoProduto } from "@/components/ui/FotoProduto";
import { LojistaNav } from "@/components/lojista/LojistaNav";
import { Carregando } from "@/components/ui/Estados";
import { clsx } from "@/lib/cx";

export default function LojistaPerfilPage() {
  const router = useRouter();
  const { data: loja, loading } = useAsync(getMinhaLoja, []);

  const [aberta, setAberta] = useState(true);
  useEffect(() => {
    if (loja) setAberta(loja.aberta);
  }, [loja]);

  async function logout() {
    await sair();
    router.push("/login");
  }

  async function toggleAberta() {
    if (!loja) return;
    const novo = !aberta;
    setAberta(novo);
    try {
      await setLojaAberta(loja.id, novo);
    } catch {
      setAberta(!novo);
    }
  }

  if (loading) return <Carregando />;

  const grupos = [
    {
      titulo: "Loja",
      itens: [
        { icon: Store, label: "Dados da loja", href: "/lojista/perfil/dados" },
        {
          icon: Clock,
          label: "Horário de funcionamento",
          href: "/lojista/perfil/horario",
        },
        {
          icon: CreditCard,
          label: "Formas de pagamento aceitas",
          href: "/lojista/perfil/pagamento",
        },
        {
          icon: MapPin,
          label: "Área de entrega",
          href: "/lojista/perfil/entrega",
          sub: loja?.raioEntregaKm
            ? `Raio de ${loja.raioEntregaKm} km`
            : undefined,
        },
      ],
    },
    {
      titulo: "Gestão",
      itens: [
        {
          icon: BarChart3,
          label: "Relatórios de vendas",
          href: "/lojista/perfil/relatorios",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <header className="rounded-b-3xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 pb-6 pt-12 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-3xl">
            <FotoProduto foto={loja?.logo ?? "🏗️"} alt={loja?.nome ?? "Loja"} emojiClassName="text-3xl" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{loja?.nome ?? "Minha loja"}</h1>
            <p className="flex items-center gap-1 text-sm text-orange-50">
              <Star size={14} className="fill-white text-white" />
              {(loja?.nota ?? 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
              })}
              {loja?.endereco ? ` · ${loja.endereco}` : ""}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur">
          <span className="text-sm font-medium">
            {aberta ? "Loja aberta" : "Loja fechada"}
          </span>
          <Toggle ligado={aberta} onChange={toggleAberta} label="Loja aberta" />
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-5">
        {grupos.map((grupo) => (
          <section key={grupo.titulo}>
            <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
              {grupo.titulo}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white">
              {grupo.itens.map((item, i) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-stone-50",
                    i > 0 && "border-t border-stone-100",
                  )}
                >
                  <item.icon size={20} className="text-stone-500" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-stone-700">
                      {item.label}
                    </span>
                    {"sub" in item && item.sub && (
                      <span className="text-xs text-stone-400">{item.sub}</span>
                    )}
                  </span>
                  <ChevronRight size={18} className="text-stone-300" />
                </Link>
              ))}
            </div>
          </section>
        ))}

        <button
          onClick={() => router.push("/home")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-100 bg-white py-3.5 text-sm font-semibold text-orange-600 transition active:bg-stone-50"
        >
          <Smartphone size={18} /> Ver app do cliente
        </button>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-100 bg-white py-3.5 text-sm font-semibold text-red-600 transition active:bg-stone-50"
        >
          <LogOut size={18} /> Sair da conta
        </button>

        <p className="pb-2 text-center text-xs text-stone-400">
          ConstruZap · painel do lojista · v1.0.0
        </p>
      </div>

      <LojistaNav />
    </div>
  );
}

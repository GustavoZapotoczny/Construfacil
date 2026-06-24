"use client";

import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  CreditCard,
  Store,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useSessao } from "@/lib/sessao";
import { sair } from "@/lib/auth";
import { enderecos } from "@/lib/data";
import { BottomNav } from "@/components/cliente/BottomNav";
import { clsx } from "@/lib/cx";

export default function PerfilPage() {
  const router = useRouter();
  const usuario = useSessao((s) => s.usuario);

  async function logout() {
    await sair();
    router.push("/login");
  }

  const grupos = [
    {
      titulo: "Conta",
      itens: [
        { icon: User, label: "Dados pessoais", onClick: () => {} },
        {
          icon: MapPin,
          label: "Endereços",
          badge: `${enderecos.length}`,
          onClick: () => {},
        },
        { icon: CreditCard, label: "Formas de pagamento", onClick: () => {} },
      ],
    },
    {
      titulo: "Lojista",
      itens: [
        {
          icon: Store,
          label: "Sou lojista — acessar painel",
          destaque: true,
          onClick: () => router.push("/lojista"),
        },
      ],
    },
    {
      titulo: "Preferências",
      itens: [
        { icon: Bell, label: "Notificações", onClick: () => {} },
        { icon: HelpCircle, label: "Ajuda e suporte", onClick: () => {} },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header laranja com avatar */}
      <header className="rounded-b-3xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 pb-6 pt-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
            {(usuario?.nome ?? "C").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold capitalize">
              {usuario?.nome ?? "Cliente"}
            </h1>
            <p className="truncate text-sm text-orange-50">
              {usuario?.email ?? "cliente@construfacil.app"}
            </p>
          </div>
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
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={clsx(
                    "flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-stone-50",
                    i > 0 && "border-t border-stone-100",
                  )}
                >
                  <item.icon
                    size={20}
                    className={
                      "destaque" in item && item.destaque
                        ? "text-orange-600"
                        : "text-stone-500"
                    }
                  />
                  <span
                    className={clsx(
                      "flex-1 text-sm font-medium",
                      "destaque" in item && item.destaque
                        ? "text-orange-600"
                        : "text-stone-700",
                    )}
                  >
                    {item.label}
                  </span>
                  {"badge" in item && item.badge && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={18} className="text-stone-300" />
                </button>
              ))}
            </div>
          </section>
        ))}

        <button
          onClick={logout}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-stone-100 bg-white py-3.5 text-sm font-semibold text-red-600 transition active:bg-stone-50"
        >
          <LogOut size={18} /> Sair da conta
        </button>

        <p className="pb-2 text-center text-xs text-stone-400">
          Construfácil · versão 1.0.0
        </p>
      </div>

      <BottomNav />
    </div>
  );
}

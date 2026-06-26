"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Package, Megaphone, Store } from "lucide-react";
import { clsx } from "@/lib/cx";
import { useLojista } from "@/lib/lojista";
import { authDisponivel } from "@/lib/auth";

const itens = [
  { href: "/lojista", label: "Início", icon: LayoutDashboard },
  { href: "/lojista/pedidos", label: "Pedidos", icon: Receipt, badge: true },
  { href: "/lojista/produtos", label: "Produtos", icon: Package },
  { href: "/lojista/marketing", label: "Marketing", icon: Megaphone },
  { href: "/lojista/perfil", label: "Perfil", icon: Store },
];

/** Menu lateral do painel do lojista — só no computador (md+). */
export function LojistaSidebarNav() {
  const pathname = usePathname();
  const novosDemo = useLojista(
    (s) => s.pedidos.filter((p) => p.status === "Novo").length,
  );
  const novos = authDisponivel ? 0 : novosDemo;

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-stone-200 bg-white md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="text-2xl">🏗️</span>
        <div className="leading-tight">
          <span className="block text-base font-bold text-stone-800">Construfácil</span>
          <span className="block text-xs text-stone-400">Painel do lojista</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {itens.map(({ href, label, icon: Icon, badge }) => {
          const ativo =
            href === "/lojista"
              ? pathname === "/lojista"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                ativo
                  ? "bg-orange-50 text-orange-600"
                  : "text-stone-500 hover:bg-stone-50",
              )}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={ativo ? 2.4 : 2} />
                {badge && novos > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                    {novos}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

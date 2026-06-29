"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, HardHat, ShoppingBag, User } from "lucide-react";
import { clsx } from "@/lib/cx";
import { useCarrinho } from "@/lib/store";
import { useMontado } from "@/lib/useMontado";

const itens = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/construtor", label: "Meu Construtor", icon: HardHat },
  { href: "/sacola", label: "Sacola", icon: ShoppingBag, badge: true },
  { href: "/perfil", label: "Perfil", icon: User },
];

/** Menu lateral exibido apenas no computador (md+). No celular, a navegação
 *  continua sendo a barra inferior (BottomNav). */
export function SidebarNav() {
  const pathname = usePathname();
  const totalItens = useCarrinho((s) => s.totalItens());
  const montado = useMontado();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-stone-200 bg-white md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ConstruZap" className="h-9 w-9 rounded-lg object-cover" />
        <span className="text-lg font-bold text-stone-800">ConstruZap</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {itens.map(({ href, label, icon: Icon, badge }) => {
          const ativo = pathname === href || pathname.startsWith(`${href}/`);
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
                {badge && montado && totalItens > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                    {totalItens}
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

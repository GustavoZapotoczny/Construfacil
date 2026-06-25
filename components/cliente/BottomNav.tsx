"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, HardHat, ShoppingBag, User } from "lucide-react";
import { clsx } from "@/lib/cx";
import { useCarrinho } from "@/lib/store";

type ItemNav = {
  href: string;
  label: string;
  icon: typeof Home;
  badge?: boolean;
};

const itens: ItemNav[] = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/construtor", label: "Meu Construtor", icon: HardHat },
  { href: "/sacola", label: "Sacola", icon: ShoppingBag, badge: true },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const totalItens = useCarrinho((s) => s.totalItens());

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-200 bg-white">
      <ul className="flex">
        {itens.map(({ href, label, icon: Icon, badge }) => {
          const ativo = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={clsx(
                  "relative flex flex-col items-center gap-0.5 px-0.5 py-2.5 text-center text-[10px] font-medium leading-tight transition",
                  ativo ? "text-orange-600" : "text-stone-400",
                )}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={ativo ? 2.4 : 2} />
                  {badge && totalItens > 0 && (
                    <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                      {totalItens}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

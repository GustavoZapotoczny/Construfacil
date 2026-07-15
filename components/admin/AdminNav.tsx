"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ArrowLeft } from "lucide-react";
import { clsx } from "@/lib/cx";

const itens = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/repasses", label: "Repasses", icon: Wallet },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
        <Link href="/perfil" aria-label="Sair do painel" className="text-stone-500">
          <ArrowLeft size={20} />
        </Link>
        <span className="mr-2 font-bold text-stone-800">Admin</span>
        <nav className="flex gap-1">
          {itens.map(({ href, label, icon: Icon }) => {
            const ativo =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                  ativo
                    ? "bg-orange-100 text-orange-700"
                    : "text-stone-500 hover:bg-stone-100",
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

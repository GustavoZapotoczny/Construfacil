"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Package, Megaphone, Wallet, Store } from "lucide-react";
import { clsx } from "@/lib/cx";
import { useLojista } from "@/lib/lojista";
import { authDisponivel } from "@/lib/auth";
import { useMontado } from "@/lib/useMontado";

type ItemNav = {
  href: string;
  label: string;
  icon: typeof Store;
  badgeNovos?: boolean;
};

const itens: ItemNav[] = [
  { href: "/lojista", label: "Início", icon: LayoutDashboard },
  { href: "/lojista/pedidos", label: "Pedidos", icon: Receipt, badgeNovos: true },
  { href: "/lojista/produtos", label: "Produtos", icon: Package },
  { href: "/lojista/marketing", label: "Marketing", icon: Megaphone },
  { href: "/lojista/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/lojista/perfil", label: "Perfil", icon: Store },
];

export function LojistaNav() {
  const pathname = usePathname();
  // Badge de "pedidos novos": no modo demo vem do store (reativo);
  // no modo real evitamos uma query a cada navegação.
  const novosDemo = useLojista(
    (s) => s.pedidos.filter((p) => p.status === "Novo").length,
  );
  const montado = useMontado();
  const novos = authDisponivel || !montado ? 0 : novosDemo;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-200 bg-white md:hidden">
      <ul className="flex">
        {itens.map(({ href, label, icon: Icon, badgeNovos }) => {
          const ativo =
            href === "/lojista"
              ? pathname === "/lojista"
              : pathname === href || pathname.startsWith(`${href}/`);
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
                  {badgeNovos && novos > 0 && (
                    <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                      {novos}
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

"use client";

import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/cliente/SidebarNav";

/** As telas de autenticação não têm menu (você ainda não está logado). */
const SEM_MENU = ["/login", "/cadastro"];

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const semMenu = SEM_MENU.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Login/cadastro: sem menu, mas centralizado como um cartão no desktop.
  if (semMenu) return <div className="md:mx-auto md:max-w-md">{children}</div>;

  return (
    <>
      <SidebarNav />
      {/* No desktop: recua pra não ficar sob o menu e centraliza o conteúdo. */}
      <div className="md:pl-60">
        <div className="md:mx-auto md:max-w-4xl">{children}</div>
      </div>
    </>
  );
}

"use client";

import { LojistaSidebarNav } from "./SidebarNav";

/** Casca responsiva do painel do lojista: menu lateral no desktop,
 *  conteúdo recuado e centralizado. No celular não muda nada. */
export function LojistaShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LojistaSidebarNav />
      <div className="md:pl-60">
        <div className="md:mx-auto md:max-w-6xl">{children}</div>
      </div>
    </>
  );
}

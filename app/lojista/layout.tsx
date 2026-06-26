import { ProtegerLojista } from "@/components/lojista/ProtegerLojista";
import { LojistaShell } from "@/components/lojista/LojistaShell";

export default function LojistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtegerLojista>
      <LojistaShell>{children}</LojistaShell>
    </ProtegerLojista>
  );
}

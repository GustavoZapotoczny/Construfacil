import { ProtegerLojista } from "@/components/lojista/ProtegerLojista";

export default function LojistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtegerLojista>{children}</ProtegerLojista>;
}

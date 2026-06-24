import { LojaView } from "@/components/cliente/LojaView";

export default function LojaPage({ params }: { params: { id: string } }) {
  return <LojaView lojaId={params.id} />;
}

import { AlertCircle } from "lucide-react";

/** Spinner centralizado para carregamento de página. */
export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}

/** Estado vazio com emoji + mensagem. */
export function Vazio({
  emoji = "📭",
  titulo,
  descricao,
  children,
}: {
  emoji?: string;
  titulo: string;
  descricao?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
        {emoji}
      </div>
      <h2 className="font-bold text-stone-800">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-stone-500">{descricao}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/** Mensagem de erro de carregamento. */
export function ErroCarregar({
  mensagem = "Não foi possível carregar.",
  onRetry,
}: {
  mensagem?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-stone-500">
      <AlertCircle size={28} className="text-red-500" />
      <p className="text-sm">{mensagem}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-semibold text-orange-600">
          Tentar novamente
        </button>
      )}
    </div>
  );
}

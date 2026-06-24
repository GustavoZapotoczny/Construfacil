"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aqui entraria um serviço de monitoramento (ex.: Sentry) em produção.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-4xl">
        ⚠️
      </div>
      <h1 className="text-lg font-bold text-stone-800">Algo deu errado</h1>
      <p className="mt-1 text-sm text-stone-500">
        Tivemos um problema ao carregar esta tela. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition active:scale-[0.99]"
      >
        Tentar novamente
      </button>
    </div>
  );
}

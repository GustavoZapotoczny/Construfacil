"use client";

import { useCallback, useEffect, useState } from "react";

interface Estado<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Executa uma função assíncrona e expõe {data, loading, error, reload}.
 * Reexecuta quando alguma das `deps` muda. Em modo mock o `fn` resolve
 * instantaneamente (sem rede), então o loading é quase imperceptível.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = [],
): Estado<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    setError(null);
    fn()
      .then((res) => {
        if (ativo) setData(res);
      })
      .catch((e) => {
        if (ativo) setError(e?.message ?? "Erro ao carregar.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload };
}

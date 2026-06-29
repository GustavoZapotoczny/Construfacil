"use client";

import { useEffect, useState } from "react";

/**
 * Retorna `false` no servidor e no 1º render do cliente, e `true` após montar.
 * Útil para esconder valores que vêm do localStorage (ex: itens do carrinho)
 * até o cliente montar, evitando erro de hidratação (servidor ≠ cliente).
 */
export function useMontado(): boolean {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}

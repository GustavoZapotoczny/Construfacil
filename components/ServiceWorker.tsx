"use client";

import { useEffect } from "react";

/**
 * Registra o service worker para tornar o app instalável (PWA) e
 * funcional offline no básico. Só roda em produção — em desenvolvimento
 * o cache do SW atrapalharia o hot reload.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* silencioso: PWA é progressivo */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}

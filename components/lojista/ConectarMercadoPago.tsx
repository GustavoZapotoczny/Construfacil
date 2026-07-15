"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Link2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Status {
  conectado: boolean;
  mpUserId: string | null;
  configurado: boolean;
  comissao: number;
}

async function autorizacao(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Cartão de conexão da conta Mercado Pago da loja (split de pagamento). */
export function ConectarMercadoPago() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/lojista/mp/status", {
        headers: { ...(await autorizacao()) },
      });
      if (r.ok) setStatus(await r.json());
    } catch {
      /* mantém o estado atual */
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const retorno = params.get("mp"); // "ok" | "erro" ao voltar do Mercado Pago

  async function conectar() {
    setErro("");
    setConectando(true);
    try {
      const r = await fetch("/api/lojista/mp/conectar", {
        headers: { ...(await autorizacao()) },
      });
      const d = await r.json();
      if (!r.ok || !d.url) {
        throw new Error(d?.erro || "Não foi possível iniciar a conexão.");
      }
      window.location.href = d.url; // vai para o Mercado Pago autorizar
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao conectar.");
      setConectando(false);
    }
  }

  if (carregando) {
    return (
      <div className="mx-4 mt-5 rounded-2xl border border-stone-100 bg-white p-5 text-sm text-stone-400">
        Carregando conexão…
      </div>
    );
  }

  const conectado = status?.conectado;
  const comissao = status?.comissao ?? 5;

  return (
    <div className="mx-4 mt-5 rounded-2xl border border-stone-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-stone-800">
            Receber pagamentos (Mercado Pago)
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Conecte sua conta para receber o valor das vendas{" "}
            <strong>direto na sua conta</strong>, automaticamente. A plataforma
            retém {comissao}% de comissão por pedido.
          </p>
        </div>
        {conectado && <CheckCircle2 size={22} className="shrink-0 text-emerald-500" />}
      </div>

      {retorno === "ok" && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          Conta conectada com sucesso! ✓
        </p>
      )}
      {retorno === "erro" && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          Não deu para conectar. Tente novamente.
        </p>
      )}
      {erro && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
      )}

      <div className="mt-4">
        {conectado ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={18} />
            Conta conectada
            {status?.mpUserId && (
              <span className="ml-auto text-xs text-emerald-600/70">
                ID {status.mpUserId}
              </span>
            )}
          </div>
        ) : status?.configurado ? (
          <button
            onClick={conectar}
            disabled={conectando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009ee3] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {conectando ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Link2 size={18} />
            )}
            {conectando ? "Abrindo o Mercado Pago…" : "Conectar Mercado Pago"}
          </button>
        ) : (
          <div className="rounded-xl bg-stone-50 px-4 py-3 text-xs text-stone-500">
            🔧 Recurso em configuração. Em breve você poderá conectar sua conta e
            receber automaticamente.
          </div>
        )}
      </div>
    </div>
  );
}

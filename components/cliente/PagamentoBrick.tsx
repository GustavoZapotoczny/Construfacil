"use client";

import { useEffect, useRef, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { Check, Copy, QrCode } from "lucide-react";
import { brl } from "@/lib/format";

let mpIniciado = false;

type Estado = "form" | "pix" | "aprovado" | "processando" | "erro";

interface PixData {
  qrCode: string;
  qrCodeBase64: string;
}

interface Props {
  /** Valor total exibido (R$). O valor cobrado é recalculado no servidor. */
  valor: number;
  descricao: string;
  /** Itens do pedido — o servidor recalcula o preço a partir deles. */
  itens: { produtoId: string; quantidade: number }[];
  lojaId: string;
  cupomCodigo?: string;
  /** Id do pedido (vira external_reference no Mercado Pago). */
  referencia?: string;
  /** Chamado quando o pagamento é aprovado (cartão) ou o Pix é confirmado. */
  onAprovado: (pagamentoId: string) => void;
}

/** Pagamento dentro do app via Mercado Pago (cartão + Pix), sem sair da tela. */
export function PagamentoBrick({
  valor,
  descricao,
  itens,
  lojaId,
  cupomCodigo,
  referencia,
  onAprovado,
}: Props) {
  const [estado, setEstado] = useState<Estado>("form");
  const [erro, setErro] = useState("");
  const [pix, setPix] = useState<PixData | null>(null);
  const [copiado, setCopiado] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const chave = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (!chave) {
      setErro(
        "Pagamento indisponível: chave do Mercado Pago não configurada.",
      );
      return;
    }
    if (!mpIniciado) {
      initMercadoPago(chave, { locale: "pt-BR" });
      mpIniciado = true;
    }
    // Valida a chave pública — se foi rotacionada/revogada, o Brick falharia
    // em silêncio (tela em branco). Aqui viramos isso numa mensagem clara.
    fetch(
      `https://api.mercadopago.com/v1/payment_methods/search?public_key=${chave}&status=active&limit=1`,
    )
      .then((r) => {
        if (!r.ok) {
          setErro(
            "Pagamento temporariamente indisponível (credencial do Mercado Pago inválida). Tente novamente mais tarde.",
          );
        }
      })
      .catch(() => {
        /* sem rede: o próprio Brick mostrará o erro */
      });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function acompanharPix(pagamentoId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/pagamento/status?id=${pagamentoId}&loja=${encodeURIComponent(lojaId)}`,
        );
        const d = await r.json();
        if (d.status === "approved") {
          if (pollRef.current) clearInterval(pollRef.current);
          setEstado("aprovado");
          onAprovado(String(pagamentoId));
        }
      } catch {
        /* tenta de novo no próximo intervalo */
      }
    }, 4000);
  }

  async function enviar(formData: unknown) {
    setErro("");
    setEstado("processando");
    try {
      const res = await fetch("/api/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, descricao, itens, lojaId, cupomCodigo, referencia }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.erro || "Falha ao processar o pagamento.");

      if (data.status === "approved") {
        setEstado("aprovado");
        onAprovado(String(data.id));
      } else if (data.pix?.qrCode) {
        setPix({ qrCode: data.pix.qrCode, qrCodeBase64: data.pix.qrCodeBase64 });
        setEstado("pix");
        acompanharPix(String(data.id));
      } else if (data.status === "rejected") {
        setErro("Pagamento recusado. Confira os dados do cartão ou tente outro.");
        setEstado("erro");
      } else {
        // pending/in_process de cartão
        setErro("Pagamento em análise. Avisaremos assim que for confirmado.");
        setEstado("erro");
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado.");
      setEstado("erro");
    }
  }

  async function copiarPix() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem clipboard: o usuário copia manualmente */
    }
  }

  if (estado === "aprovado") {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check size={32} />
        </div>
        <p className="text-lg font-bold text-stone-800">Pagamento confirmado!</p>
        <p className="text-sm text-stone-500">Estamos preparando seu pedido…</p>
      </div>
    );
  }

  if (estado === "pix" && pix) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="flex items-center gap-2 font-semibold text-stone-800">
          <QrCode size={18} /> Pague com Pix pra confirmar
        </p>
        <p className="text-sm text-stone-500">
          Escaneie o QR Code no app do seu banco. A confirmação é automática.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR Code Pix"
          className="h-56 w-56 rounded-xl border border-stone-200"
        />
        <button
          onClick={copiarPix}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          {copiado ? <Check size={16} /> : <Copy size={16} />}
          {copiado ? "Copiado!" : "Copiar código Pix"}
        </button>
        <p className="mt-1 flex items-center gap-2 text-xs text-stone-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
          Aguardando o pagamento…
        </p>
      </div>
    );
  }

  return (
    <div>
      {estado === "processando" && (
        <p className="mb-3 text-center text-sm text-stone-500">Processando…</p>
      )}
      {erro && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          {erro}
        </p>
      )}
      <Payment
        initialization={{ amount: valor }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            bankTransfer: "all", // Pix
          },
        }}
        onSubmit={async (param) => {
          await enviar(param.formData);
        }}
        onError={() => setErro("Não foi possível carregar o pagamento. Recarregue a página.")}
      />
    </div>
  );
}

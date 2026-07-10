/**
 * Rate limit simples em memória (janela deslizante por IP).
 * Em serverless cada instância tem seu próprio contador — não é perfeito,
 * mas barra abuso básico (flood de pagamento/assistente) sem dependências.
 */
const janelas = new Map<string, number[]>();

/** Limpa entradas velhas de vez em quando para não crescer sem limite. */
let ultimaLimpeza = 0;

/**
 * Retorna true se a chamada está dentro do limite; false se estourou.
 * @param chave   identificador (ex.: "pagamento:1.2.3.4")
 * @param limite  máximo de chamadas por janela
 * @param janelaMs tamanho da janela em ms (padrão 60s)
 */
export function dentroDoLimite(
  chave: string,
  limite: number,
  janelaMs = 60_000,
): boolean {
  const agora = Date.now();

  if (agora - ultimaLimpeza > janelaMs * 5) {
    ultimaLimpeza = agora;
    janelas.forEach((ts, k) => {
      if (ts.every((t) => agora - t > janelaMs)) janelas.delete(k);
    });
  }

  const registros = (janelas.get(chave) ?? []).filter(
    (t) => agora - t < janelaMs,
  );
  if (registros.length >= limite) {
    janelas.set(chave, registros);
    return false;
  }
  registros.push(agora);
  janelas.set(chave, registros);
  return true;
}

/** Extrai o IP do cliente atrás do proxy da Vercel. */
export function ipDaRequisicao(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "desconhecido";
}

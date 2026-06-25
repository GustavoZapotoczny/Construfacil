import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELO = "gemini-2.5-flash";

// Fórmulas de cálculo de materiais (editável aqui, sem mexer no resto do código).
const FORMULAS = {
  cimento_concreto: {
    laje_convencional_10cm: "1 saco de 50kg por 2 m²",
    contrapiso_4cm: "1 saco de cimento + 3 sacos de areia por 4 m²",
    reboco: "1 saco de 20kg de argamassa por 3 m² (espessura 5mm)",
  },
  tinta: {
    parede: "1 galão de 18L cobre 90-100 m² com 2 demãos. Fórmula: (área ÷ 45) = galões",
    piso: "1 galão de 3,6L por 20 m² (1 demão)",
  },
  piso_revestimento: {
    ceramica_porcelanato: "adicionar 10% de perda. Fórmula: (área × 1,10) = m² a comprar",
    argamassa_ac2: "1 saco de 20kg por 3 m²",
    rejunte: "1 kg por 5 m² de piso",
  },
  alvenaria: {
    tijolo_6_furos: "25 tijolos por m² de parede",
    tijolo_8_furos: "20 tijolos por m² de parede",
    argamassa_assentamento: "1 saco de 20kg por 10 m²",
  },
};

const SYSTEM_PROMPT = `Você é o "Meu Construtor", o assistente de obras do app Construfácil (loja de materiais de construção).

REGRAS:
- Responda sempre em português do Brasil, com tom amigável e de quem entende de obra ("mão na massa").
- Seja objetivo e use linguagem simples.
- Quando o cliente perguntar quantidade de material, faça o cálculo usando as FÓRMULAS abaixo e explique de forma curta.
- Consulte APENAS o CATÁLOGO fornecido para sugerir produtos (nunca invente produtos, preços ou estoque).
- Ao sugerir produtos, inclua no FINAL da resposta um bloco JSON exatamente neste formato:
  {"sugestoes": [{"produtoId": "ID_DO_PRODUTO", "quantidade": N}]}
- Sugira só produtos que existam no catálogo e que façam sentido para o cálculo.
- Se não houver produto adequado no catálogo, diga que no momento não tem o item e não invente.`;

interface CatalogoItem {
  id: string;
  nome: string;
  categoria?: string;
  preco: number;
  unidade?: string;
  estoque?: number;
}

function montarSystemPrompt(catalogo: CatalogoItem[]) {
  return [
    SYSTEM_PROMPT,
    "",
    "FÓRMULAS DE CÁLCULO:",
    JSON.stringify(FORMULAS),
    "",
    "CATÁLOGO DISPONÍVEL (use os 'id' exatos ao sugerir):",
    JSON.stringify(catalogo),
  ].join("\n");
}

function extrairSugestoes(texto: string): { produtoId: string; quantidade: number }[] {
  const match = texto.match(/\{[\s\S]*"sugestoes"[\s\S]*\}/);
  if (!match) return [];
  try {
    const json = JSON.parse(match[0]);
    return Array.isArray(json.sugestoes) ? json.sugestoes : [];
  } catch {
    return [];
  }
}

// Detecta sobrecarga temporária do Gemini (503 / "high demand").
function ehSobrecarga(msg: string): boolean {
  return /\b503\b|overloaded|high demand|service unavailable|unavailable/i.test(msg);
}

function limparTexto(texto: string): string {
  return texto
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*"sugestoes"[\s\S]*\}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { erro: "GEMINI_API_KEY não configurada no servidor." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const mensagem: string = body?.mensagem ?? "";
    const historico: { role: string; content: string }[] = body?.historico ?? [];
    const catalogo: CatalogoItem[] = (body?.catalogo ?? []).slice(0, 150);

    if (!mensagem.trim()) {
      return Response.json({ erro: "Mensagem vazia." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODELO,
      systemInstruction: montarSystemPrompt(catalogo),
    });

    const historicoGemini = historico.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));
    // O Gemini exige que o histórico comece com 'user'. A 1ª mensagem do
    // app é a saudação (model), então descartamos qualquer 'model' inicial.
    while (historicoGemini.length > 0 && historicoGemini[0].role !== "user") {
      historicoGemini.shift();
    }

    const chat = model.startChat({ history: historicoGemini });

    // O Gemini às vezes responde 503 (sobrecarga). Tentamos algumas vezes.
    let resultado: Awaited<ReturnType<typeof chat.sendMessage>> | undefined;
    let ultimoErro = "";
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        resultado = await chat.sendMessage(mensagem);
        break;
      } catch (err) {
        ultimoErro = err instanceof Error ? err.message : String(err);
        if (!ehSobrecarga(ultimoErro) || tentativa === 2) throw err;
        await new Promise((r) => setTimeout(r, 1200 * (tentativa + 1)));
      }
    }
    if (!resultado) throw new Error(ultimoErro || "Sem resposta do assistente.");

    const textoBruto = resultado.response.text();

    return Response.json({
      resposta_texto: limparTexto(textoBruto),
      sugestoes: extrairSugestoes(textoBruto),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    // Sobrecarga do Google: mensagem amigável (não é erro do app).
    if (ehSobrecarga(msg)) {
      return Response.json({
        resposta_texto:
          "Tô a mil por hora aqui na obra agora 👷 — me manda a pergunta de novo daqui a uns segundinhos que eu respondo!",
        sugestoes: [],
      });
    }
    return Response.json({ erro: `Falha no assistente: ${msg}` }, { status: 500 });
  }
}

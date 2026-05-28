/**
 * Wrapper sobre a edge function `gemini` (proxy do Studio que aceita
 * { model, body } e encaminha pro Google Generative AI).
 *
 * Reuso evita configurar GOOGLE_AI_KEY duas vezes e duplicar codigo de
 * proxy. Tradeoff: blast radius compartilhado com Studio.
 *
 * Decisao tomada no commit 8 (ver project_farm_supabase.md).
 */

import { RECEIPT_OCR_PROMPT } from "../prompts/receiptOcr.pt-br.ts";

const DEFAULT_MODEL = "gemini-3.5-flash";

interface GeminiSuccess {
  ok: true;
  data: ReceiptExtraction;
  rawText: string;
}

interface GeminiError {
  ok: false;
  error: string;
}

export interface ReceiptExtraction {
  vendor: string | null;
  vendor_cnpj: string | null;
  total_value: number | null;
  transaction_date: string | null;
  doc_type: "cupom" | "nota_fiscal" | "recibo" | "pix" | "boleto" | "outro";
  payment_method:
    | "pix"
    | "cartao"
    | "boleto"
    | "dinheiro"
    | "transferencia"
    | null;
  invoice_number: string | null;
  category: string;
  description: string | null;
  direction: "expense" | "income";
  confidence: number;
}

export async function extractReceiptFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<GeminiSuccess | GeminiError> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return { ok: false, error: "missing_supabase_env" };
  }

  const geminiPayload = {
    model: DEFAULT_MODEL,
    body: {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: RECEIPT_OCR_PROMPT },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1,
      },
    },
  };

  let resp: Response;
  try {
    resp = await fetch(`${supabaseUrl}/functions/v1/gemini`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(geminiPayload),
    });
  } catch (err) {
    console.error("[gemini] network error:", err);
    return { ok: false, error: "gemini_network_error" };
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    console.error(`[gemini] non-2xx ${resp.status}:`, body);
    return { ok: false, error: `gemini_http_${resp.status}` };
  }

  let json: unknown;
  try {
    json = await resp.json();
  } catch (err) {
    console.error("[gemini] failed to parse outer JSON:", err);
    return { ok: false, error: "gemini_invalid_outer_json" };
  }

  // Google API formato: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
  const text = (json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  })?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== "string") {
    console.error("[gemini] no text in response:", json);
    return { ok: false, error: "gemini_no_text" };
  }

  let extracted: ReceiptExtraction;
  try {
    extracted = JSON.parse(text);
  } catch (err) {
    console.error("[gemini] failed to parse inner JSON:", err, text);
    return { ok: false, error: "gemini_invalid_inner_json" };
  }

  return { ok: true, data: extracted, rawText: text };
}

/**
 * Transcricao de audio via Gemini multimodal. Usado pra mensagens de voz no
 * WhatsApp ("gastei 800 de adubo na Marambaia") -> texto -> runFarmAi.
 *
 * Gemini 3.5 Flash aceita audio inline (ogg/opus do WhatsApp inclusive).
 * Limite pratico ~9.5MB por inline_data. Para audios maiores usaria Files API,
 * mas mensagem WhatsApp tem teto de 16MB e voz costuma ficar bem abaixo disso.
 */
export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
): Promise<
  | { ok: true; transcript: string }
  | { ok: false; error: string }
> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return { ok: false, error: "missing_supabase_env" };
  }

  const prompt =
    "Transcreva fielmente o audio para portugues do Brasil. " +
    "Devolva SOMENTE o texto transcrito, sem prefixos, sem comentarios, " +
    "sem aspas. Corrija pontuacao para soar natural. Se o audio estiver " +
    'inaudivel ou vazio, devolva exatamente "[inaudivel]".';

  const payload = {
    model: DEFAULT_MODEL,
    body: {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: audioBase64 } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: { temperature: 0.0 },
    },
  };

  let resp: Response;
  try {
    resp = await fetch(`${supabaseUrl}/functions/v1/gemini`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[gemini audio] network error:", err);
    return { ok: false, error: "gemini_network_error" };
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    console.error(`[gemini audio] non-2xx ${resp.status}:`, body);
    return { ok: false, error: `gemini_http_${resp.status}` };
  }

  let json: unknown;
  try {
    json = await resp.json();
  } catch (err) {
    console.error("[gemini audio] failed to parse JSON:", err);
    return { ok: false, error: "gemini_invalid_json" };
  }

  const text = (json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  })?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== "string") {
    console.error("[gemini audio] no text in response:", json);
    return { ok: false, error: "gemini_no_text" };
  }

  const cleaned = text.trim().replace(/^["']|["']$/g, "");
  return { ok: true, transcript: cleaned };
}

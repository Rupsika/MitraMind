import { env } from "../config/env";
import { AppError } from "../utils/errors";

export interface AiChatResponse {
  answer: string;
  language: string;
  riskLevel: "NORMAL" | "DISTRESS" | "HIGH_CONCERN" | "CRISIS_SIGNAL";
  triggerType: string;
  sources: { title: string; page?: number | null }[];
  showCrisisResources: boolean;
  helplines: { title: string; message: string; numbers: { name: string; number: string; availability: string }[] } | null;
}

async function call(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  try {
    const res = await fetch(`${env.AI_SERVICE_URL}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) {
      throw new AppError(res.status === 503 ? 503 : 502, "The AI service could not complete the request.", "ai_unavailable");
    }
    return res;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(503, "The AI service is unavailable right now.", "ai_unavailable");
  }
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const aiClient = {
  async chat(input: {
    message: string;
    language: string;
    conversationId: string;
    history: { role: "user" | "assistant"; content: string }[];
  }): Promise<AiChatResponse> {
    const res = await call(
      "/ai/chat",
      json({ message: input.message, language: input.language, conversation_id: input.conversationId, history: input.history }),
      60_000,
    );
    return (await res.json()) as AiChatResponse;
  },

  async analyzeSafety(message: string) {
    const res = await call("/ai/safety/analyze", json({ message }), 10_000);
    return (await res.json()) as Pick<AiChatResponse, "riskLevel" | "triggerType" | "showCrisisResources" | "helplines"> & {
      action: string;
    };
  },

  async transcribe(audio: Buffer, filename: string, mimeType: string, language: string): Promise<{ text: string }> {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), filename);
    form.append("language", language);
    const res = await call("/ai/transcribe", { method: "POST", body: form }, 30_000);
    return (await res.json()) as { text: string };
  },

  async synthesize(text: string, language: string): Promise<Buffer> {
    const res = await call("/ai/synthesize", json({ text, language }), 30_000);
    return Buffer.from(await res.arrayBuffer());
  },
};

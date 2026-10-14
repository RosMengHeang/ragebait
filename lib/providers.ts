import { RAGE_SYSTEM_PROMPT } from "./prompt";
import { delay, encodeTextStream } from "./stream";
import type { ChatTurn } from "./types";

type EngineName = "openai" | "google";

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function openAiDelta(data: string): string {
  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return parsed.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
}

function googleDelta(data: string): string {
  try {
    const parsed = JSON.parse(data) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const parts = parsed.candidates?.[0]?.content?.parts ?? [];
    return parts.map((part) => part.text ?? "").join("");
  } catch {
    return "";
  }
}

async function readFirstText(
  response: Response,
  extract: (data: string) => string,
): Promise<{ first: string; pull: () => Promise<string | null> } | null> {
  if (!response.ok || !response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  const pullLine = async (): Promise<string | null> => {
    while (!done) {
      const newline = buffer.indexOf("\n");
      if (newline === -1) {
        const chunk = await reader.read();
        if (chunk.done) {
          done = true;
          buffer += decoder.decode();
          if (!buffer.trim()) return null;
          const last = buffer;
          buffer = "";
          return last;
        }
        buffer += decoder.decode(chunk.value, { stream: true });
        continue;
      }
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      return line;
    }
    return null;
  };

  const pullText = async (): Promise<string | null> => {
    while (true) {
      const line = await pullLine();
      if (line === null) return null;
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data) continue;
      if (data === "[DONE]") return null;
      const text = extract(data);
      if (text) return text;
    }
  };

  const pending = pullText().catch(() => null);
  const first = await Promise.race([
    pending,
    delay(20000).then(() => "TIMEOUT" as const),
  ]);

  if (first === "TIMEOUT" || !first) {
    await reader.cancel().catch(() => undefined);
    return null;
  }

  return { first, pull: pullText };
}

async function openAiStream(key: string, messages: ChatTurn[]): Promise<ReadableStream<Uint8Array> | null> {
  const model = envValue("OPENAI_MODEL") || "gpt-4o-mini";
  const body: Record<string, unknown> = {
    model,
    stream: true,
    max_completion_tokens: 700,
    messages: [{ role: "system", content: RAGE_SYSTEM_PROMPT }, ...messages],
  };

  if (!/^gpt-5|^o\d/i.test(model)) {
    body.temperature = 1.05;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const opened = await readFirstText(response, openAiDelta);
  if (!opened) return null;
  return encodeTextStream(opened.pull, opened.first);
}

function geminiContents(messages: ChatTurn[]) {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const message of messages) {
    const role = message.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    const part = last?.parts[0];
    if (last && part && last.role === role) {
      part.text += `\n\n${message.content}`;
    } else {
      contents.push({ role, parts: [{ text: message.content }] });
    }
  }

  if (contents[0]?.role === "model") contents.shift();
  return contents;
}

async function googleStream(key: string, messages: ChatTurn[]): Promise<ReadableStream<Uint8Array> | null> {
  const model = envValue("GOOGLE_MODEL") || "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: RAGE_SYSTEM_PROMPT }] },
      contents: geminiContents(messages),
      generationConfig: {
        temperature: 1.1,
        maxOutputTokens: 800,
      },
    }),
  });

  const opened = await readFirstText(response, googleDelta);
  if (!opened) return null;
  return encodeTextStream(opened.pull, opened.first);
}

export async function streamFromProvider(messages: ChatTurn[]): Promise<{
  engine: EngineName;
  stream: ReadableStream<Uint8Array>;
} | null> {
  const openaiKey = envValue("OPENAI_API_KEY");
  const googleKey = envValue("GOOGLE_GENERATIVE_AI_API_KEY");

  try {
    if (openaiKey) {
      const stream = await openAiStream(openaiKey, messages);
      return stream ? { engine: "openai", stream } : null;
    }
    if (googleKey) {
      const stream = await googleStream(googleKey, messages);
      return stream ? { engine: "google", stream } : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function providerConfigured(): EngineName | null {
  if (envValue("OPENAI_API_KEY")) return "openai";
  if (envValue("GOOGLE_GENERATIVE_AI_API_KEY")) return "google";
  return null;
}

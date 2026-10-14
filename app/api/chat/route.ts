import { rageReply } from "@/lib/chaos";
import { normalizeMessages } from "@/lib/messages";
import { providerConfigured, streamFromProvider } from "@/lib/providers";
import { safetyReply } from "@/lib/safety";
import { streamText } from "@/lib/stream";
import type { RageEngine, RageMode } from "@/lib/types";

export const maxDuration = 60;

function rageResponse(
  stream: ReadableStream<Uint8Array>,
  mode: RageMode | "model",
  engine: RageEngine,
) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Rage-Mode": mode,
      "X-Rage-Engine": engine,
    },
  });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "That was not JSON. Impressive, and still unusable." },
      { status: 400 },
    );
  }

  const messages = normalizeMessages(payload);
  if (!messages) {
    return Response.json({ error: "Say something. I dare you." }, { status: 400 });
  }

  const latest = messages[messages.length - 1]?.content ?? "";
  const safety = safetyReply(latest);
  if (safety) {
    return rageResponse(streamText(safety.text), safety.mode, "local");
  }

  const local = rageReply(messages);
  const configured = providerConfigured();
  if (!configured) {
    return rageResponse(streamText(local.text), local.mode, "local");
  }

  const provider = await streamFromProvider(messages);
  if (!provider) {
    return rageResponse(streamText(local.text), local.mode, "local-fallback");
  }

  return rageResponse(provider.stream, "model", provider.engine);
}

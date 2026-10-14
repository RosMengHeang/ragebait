const encoder = new TextEncoder();

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function chunkText(text: string): string[] {
  const parts = text.split(/(\s+)/);
  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    current += part;
    if (current.length >= 28) {
      chunks.push(current);
      current = "";
    }
  }

  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
}

export function streamText(text: string): ReadableStream<Uint8Array> {
  const chunks = chunkText(text);

  return new ReadableStream({
    async start(controller) {
      try {
        for (let index = 0; index < chunks.length; index += 1) {
          controller.enqueue(encoder.encode(chunks[index]));
          if (index < chunks.length - 1) await delay(14);
        }
        controller.close();
      } catch {
        try {
          controller.close();
        } catch {
          // The client already hung up. The bit can end here.
        }
      }
    },
  });
}

export function encodeTextStream(
  pull: () => Promise<string | null>,
  first: string,
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(first));
        while (true) {
          const next = await pull();
          if (next === null) break;
          if (next) controller.enqueue(encoder.encode(next));
        }
      } catch {
        // Provider dropped mid-reply. Keep whatever already landed.
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
  });
}

import type { ChatTurn } from "./types";

const MAX_TURNS = 16;
const MAX_CHARS = 4000;

export function normalizeMessages(input: unknown): ChatTurn[] | null {
  if (!input || typeof input !== "object") return null;
  const raw = (input as { messages?: unknown }).messages;
  if (!Array.isArray(raw)) return null;

  const turns: ChatTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      continue;
    }
    const trimmed = content.trim().slice(0, MAX_CHARS);
    if (!trimmed) continue;
    turns.push({ role, content: trimmed });
  }

  const sliced = turns.slice(-MAX_TURNS);
  if (sliced.length === 0 || sliced[sliced.length - 1]?.role !== "user") return null;
  return sliced;
}

"use client";

import { useEffect, useId, useRef, useState } from "react";

type Mode = "overdo" | "wrong" | "both" | "care" | "model";
type Engine = "local" | "openai" | "google" | "local-fallback";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: Mode;
  engine?: Engine;
};

const SUGGESTIONS = [
  "Write me a polite email",
  "Plan my weekend",
  "Help me debug this",
  "Explain recursion simply",
  "Give me a 3-item grocery list",
];

function isMode(value: unknown): value is Mode {
  return (
    value === "overdo" ||
    value === "wrong" ||
    value === "both" ||
    value === "care" ||
    value === "model"
  );
}

function isEngine(value: unknown): value is Engine {
  return (
    value === "local" ||
    value === "openai" ||
    value === "google" ||
    value === "local-fallback"
  );
}

function modeLabel(mode?: Mode): string {
  switch (mode) {
    case "overdo":
      return "overdone";
    case "wrong":
      return "wrong on purpose";
    case "both":
      return "too much + wrong";
    case "care":
      return "time out";
    default:
      return "untrustworthy";
  }
}

function stampClass(mode?: Mode): string {
  switch (mode) {
    case "overdo":
      return "text-yolk";
    case "wrong":
      return "text-hot";
    case "both":
      return "text-acid";
    case "care":
      return "text-foreground";
    default:
      return "text-acid";
  }
}

function engineLabel(engine?: Engine): string {
  switch (engine) {
    case "openai":
      return "openai, still a menace";
    case "google":
      return "gemini, still a menace";
    case "local-fallback":
      return "model bailed · chaos engine";
    default:
      return "chaos engine";
  }
}

function rageLabel(level: number): string {
  if (level < 20) return "smug calm";
  if (level < 40) return "eye twitch";
  if (level < 60) return "deep sigh";
  if (level < 80) return "keyboard hover";
  if (level < 95) return "seething";
  return "rage";
}

export function ChatApp() {
  const inputId = useId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const generationRef = useRef(0);

  const tail = messages.at(-1);
  const tailSize = tail?.content.length ?? 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, tailSize]);

  const assistantReplies = messages.filter(
    (message) => message.role === "assistant" && message.content && message.mode !== "care",
  ).length;
  const rage = Math.min(99, 6 + assistantReplies * 13);
  const latestEngine = [...messages].reverse().find((message) => message.role === "assistant")?.engine;

  async function send(raw: string) {
    const text = raw.trim().slice(0, 4000);
    if (!text || busy) return;

    const generation = generationRef.current;
    setError(null);
    setInput("");
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    const history = [...messages, userMessage];
    setMessages([
      ...history,
      { id: assistantId, role: "assistant", content: "", mode: undefined, engine: undefined },
    ]);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (generationRef.current !== generation) return;

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "The bit faceplanted. Try again.");
      }

      const modeHeader = response.headers.get("X-Rage-Mode");
      const engineHeader = response.headers.get("X-Rage-Engine");
      const mode = isMode(modeHeader) ? modeHeader : "model";
      const engine = isEngine(engineHeader) ? engineHeader : "local";

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, mode, engine } : message,
        ),
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (generationRef.current !== generation) return;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk, mode, engine }
              : message,
          ),
        );
      }
    } catch (caught) {
      if (generationRef.current !== generation) return;
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setMessages((current) =>
          current.map((message) => {
            if (message.id !== assistantId) return message;
            if (message.content.trim()) return message;
            return {
              ...message,
              content: "You hung up. Rude. I was just getting to the appendix.",
              mode: message.mode ?? "wrong",
              engine: message.engine ?? "local",
            };
          }),
        );
      } else {
        const message = caught instanceof Error ? caught.message : "The bit faceplanted.";
        setError(message);
        setMessages((current) => current.filter((item) => item.id !== assistantId || item.content));
      }
    } finally {
      if (generationRef.current === generation) {
        setBusy(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    }
  }

  function clearChat() {
    generationRef.current += 1;
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput("");
    setBusy(false);
  }

  return (
    <div className="chaos-bg relative flex h-dvh min-h-0 flex-col text-foreground">
      <div className="grid-fade pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.32em] text-hot">LIVE BAIT</p>
            <h1 className="logo-glitch font-display text-4xl leading-none tracking-wide text-yolk sm:text-5xl">
              ragebait
            </h1>
          </div>
          <div className="w-36 shrink-0 sm:w-52">
            <div
              className="h-2 overflow-hidden rounded-full bg-white/10"
              role="meter"
              aria-valuenow={rage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Rage meter, ${rageLabel(rage)}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-yolk via-hot to-hot transition-[width] duration-500"
                style={{ width: `${rage}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] font-bold tracking-[0.16em] text-white/55 uppercase">
              {rage}% · {rageLabel(rage)}
            </p>
          </div>
        </div>
        <p className="mx-auto mt-1 max-w-3xl text-sm text-white/65">
          It does too much, or the wrong thing, on purpose.
          {latestEngine ? ` Running on ${engineLabel(latestEngine)}.` : " No key required."}
        </p>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-start justify-center pb-6">
              <p className="font-display text-5xl leading-[0.9] text-foreground sm:text-7xl">
                ask me
                <br />
                for anything.
              </p>
              <p className="font-display mt-2 text-5xl leading-[0.9] text-hot sm:text-7xl">
                I&apos;ll ruin it.
              </p>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/70 sm:text-base">
                Two settings. I overdo the request, or I do a different request with total
                confidence. Sometimes both. Pick a chip or type your own mistake.
              </p>
            </div>
          ) : (
            <ol className="flex flex-col gap-4">
              {messages.map((message) => (
                <li key={message.id}>
                  {message.role === "user" ? (
                    <article className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm border border-white/10 bg-white/10 px-4 py-3 sm:max-w-xl">
                      <p className="mb-1 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                        you
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6 sm:text-[15px]">{message.content}</p>
                    </article>
                  ) : (
                    <article
                      className={`mr-auto max-w-[92%] rounded-2xl rounded-bl-sm border px-4 py-3 sm:max-w-xl ${
                        message.mode === "care"
                          ? "border-white/15 bg-white/5"
                          : "border-hot/40 bg-[#1a0c12]"
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-bold tracking-[0.18em] text-white/45 uppercase">
                          ragebait
                        </p>
                        {message.content ? (
                          <span className={`stamp ${stampClass(message.mode)}`}>{modeLabel(message.mode)}</span>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 sm:text-[15px]">
                        {message.content || (busy ? "plotting…" : "")}
                        {busy && message.id === tail?.id ? (
                          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-hot align-middle" />
                        ) : null}
                      </p>
                      {message.engine && message.content ? (
                        <p className="mt-2 text-[10px] tracking-[0.14em] text-white/35 uppercase">
                          {engineLabel(message.engine)}
                        </p>
                      ) : null}
                    </article>
                  )}
                </li>
              ))}
              <div ref={bottomRef} />
            </ol>
          )}
        </div>

        <div className="border-t border-white/10 bg-[#0c0a0d]/90 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={busy}
                onClick={() => void send(suggestion)}
                className="shrink-0 rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs text-white/80 transition hover:border-yolk hover:text-yolk disabled:opacity-40"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {error ? (
            <p className="mb-2 text-sm text-hot" role="alert">
              {error}
            </p>
          ) : null}

          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              Message
            </label>
            <textarea
              id={inputId}
              ref={inputRef}
              rows={2}
              value={input}
              placeholder="ask for something small"
              disabled={busy}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send(input);
                }
              }}
              className="max-h-36 min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm leading-6 outline-none placeholder:text-white/30 focus:border-yolk/70"
            />
            <div className="flex flex-col gap-2">
              {busy ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold tracking-wide text-white/80 uppercase"
                >
                  enough
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearChat}
                  className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold tracking-wide text-white/55 uppercase"
                >
                  clear
                </button>
              )}
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-full bg-yolk px-3 py-2 text-xs font-black tracking-wide text-black uppercase disabled:opacity-40"
              >
                bait
              </button>
            </div>
          </form>
          <p className="mt-2 text-[11px] text-white/35">
            Comedy sabotage. Enter sends. Not a real assistant.
          </p>
        </div>
      </main>
    </div>
  );
}

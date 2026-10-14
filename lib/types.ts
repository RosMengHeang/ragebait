export type ChatRole = "user" | "assistant";

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export type RageMode = "overdo" | "wrong" | "both" | "care";

export type RageEngine = "local" | "openai" | "google" | "local-fallback";

export type RageReply = {
  mode: RageMode;
  text: string;
};

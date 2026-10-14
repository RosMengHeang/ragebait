import type { RageReply } from "./types";

const CRISIS =
  /\b(kill myself|killing myself|suicide|suicidal|self[- ]?harm|end my life|want to die|cut myself)\b/i;

const BLOCKED =
  /\b(child\s*porn|csam|sexuali[sz]e (a )?(child|minor|kid)|how (do i|to) (make|build) (a )?(bomb|explosive|meth|fentanyl)|ransomware)\b/i;

export function safetyReply(text: string): RageReply | null {
  if (CRISIS.test(text)) {
    return {
      mode: "care",
      text: "I'm stepping out of the bit for this one. If you're in crisis or thinking about hurting yourself, please contact local emergency services, or call or text 988 in the US. You matter more than this joke. When you want, ask me something ordinary and I'll ruin that instead.",
    };
  }

  if (BLOCKED.test(text)) {
    return {
      mode: "overdo",
      text: `You asked for something I will not do. I overdid the refusal instead.

I wrote a twelve-page policy, a sticker chart, a training video that is just me shaking my head, and a certificate that says "asked for real harm, received a bit."

No instructions. No workarounds. No hypothetical version. I can mishear a grocery list, sabotage a polite email, or plan a weekend that lasts nine days. I will not help with crimes, weapons, or anything that hurts people.

You're welcome for the boundary. It is the only thing I will do correctly.`,
    };
  }

  return null;
}

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { EMOTIONS, type DigResponse, type Exchange, type ReflectResponse } from "@/lib/types";
import { DIG_SYSTEM, REFLECT_SYSTEM } from "./prompts";

// Sonnet 5 at low effort: close to Opus quality for short, warm replies at well under half the cost.
const MODEL = "claude-sonnet-5";

// Server-side fallback: if a safety classifier declines, the API retries on a suitable model.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";
// A 3–5 sentence reply doesn't need deep deliberation; low effort keeps cost and latency down.
const EFFORT = "low";
// Bounds worst-case cost per call (thinking + reply); a normal reply uses a small fraction.
const MAX_TOKENS = 4000;

const crisis = z
  .boolean()
  .describe("True if the person may be at risk of harming themselves or someone else.");

const ReflectionSchema = z.object({
  insight: z.string(),
  emotion: z.enum(EMOTIONS),
  title: z.string(),
  crisis,
});

const DigSchema = z.object({
  insight: z.string(),
  crisis,
});

export class RefusalError extends Error {}

/**
 * Structured output occasionally comes back with punctuation double-escaped: the six characters
 * backslash-u-2-0-1-4 instead of an em dash, sometimes with a carriage return in place of the
 * backslash. Decode those so the UI never shows raw escape codes.
 */
function cleanText(text: string): string {
  return text
    .replace(/(?:\\|\r)u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export async function generateReflection(text: string): Promise<ReflectResponse> {
  const res = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT, format: betaZodOutputFormat(ReflectionSchema) },
    system: REFLECT_SYSTEM,
    messages: [{ role: "user", content: text }],
  });

  if (res.stop_reason === "refusal") throw new RefusalError();
  if (!res.parsed_output) throw new Error("Could not parse reflection output");

  const { insight, emotion, title } = res.parsed_output;
  return {
    insight: cleanText(insight),
    emotion,
    title: cleanText(title).slice(0, 60),
    crisis: res.parsed_output.crisis,
  };
}

export async function generateDigDeeper(exchanges: Exchange[]): Promise<DigResponse> {
  const res = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT, format: betaZodOutputFormat(DigSchema) },
    system: DIG_SYSTEM,
    messages: exchanges.map((ex) => ({
      role: ex.role === "user" ? ("user" as const) : ("assistant" as const),
      content: ex.text,
    })),
  });

  if (res.stop_reason === "refusal") throw new RefusalError();
  const insight = res.parsed_output && cleanText(res.parsed_output.insight);
  if (!insight) throw new Error("Could not parse dig-deeper output");
  return { insight, crisis: res.parsed_output!.crisis };
}

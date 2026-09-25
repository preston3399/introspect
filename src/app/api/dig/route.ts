import { generateDigDeeper } from "@/lib/ai/claude";
import { toErrorResponse } from "@/lib/ai/errors";
import { rateLimit } from "@/lib/rateLimit";
import type { DigRequest, Exchange } from "@/lib/types";

const MAX_EXCHANGES = 40;
const MAX_CHARS = 4000;

function isValidThread(value: unknown): value is Exchange[] {
  if (!Array.isArray(value) || value.length < 3 || value.length > MAX_EXCHANGES) return false;
  return value.every(
    (ex, i) =>
      ex &&
      typeof ex.text === "string" &&
      ex.text.trim().length > 0 &&
      ex.text.length <= MAX_CHARS &&
      // Must alternate user → agent and end on the user's new message.
      ex.role === (i % 2 === 0 ? "user" : "agent"),
  ) && value.length % 2 === 1;
}

// Adaptive thinking can take a while on longer threads.
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<DigRequest> | null;
  if (!isValidThread(body?.exchanges)) {
    return Response.json({ error: "Invalid reflection thread." }, { status: 400 });
  }

  const limited = await rateLimit(req);
  if (limited) return limited;

  try {
    return Response.json(await generateDigDeeper(body.exchanges), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return toErrorResponse(err);
  }
}

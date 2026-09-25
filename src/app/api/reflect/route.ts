import { generateReflection } from "@/lib/ai/claude";
import { toErrorResponse } from "@/lib/ai/errors";
import { rateLimit } from "@/lib/rateLimit";
import type { ReflectRequest } from "@/lib/types";

const MAX_CHARS = 4000;

// Adaptive thinking can take a while on longer threads.
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<ReflectRequest> | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS) {
    return Response.json({ error: "Please share between 1 and 4000 characters." }, { status: 400 });
  }

  const limited = await rateLimit(req);
  if (limited) return limited;

  try {
    return Response.json(await generateReflection(text), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return toErrorResponse(err);
  }
}

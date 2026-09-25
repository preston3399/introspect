import Anthropic from "@anthropic-ai/sdk";
import { RefusalError } from "./claude";

/**
 * Map a failure from the Claude call to a user-facing message + HTTP status.
 *
 * Privacy: server logs never include what the person wrote or what Claude replied —
 * only the error type and HTTP status, so failures can be diagnosed without content.
 */
export function toErrorResponse(err: unknown): Response {
  let status = 502;
  let message = "Something went wrong reaching the reflection service. Try again.";

  if (err instanceof RefusalError) {
    status = 422;
    message = "I couldn't respond to that one. Try putting it a little differently.";
  } else if (err instanceof Anthropic.AuthenticationError) {
    status = 500;
    message = "The server's Anthropic API key is missing or invalid.";
    console.error("Claude API: authentication failed");
  } else if (err instanceof Anthropic.RateLimitError) {
    status = 429;
    message = "Lots of reflections at once — give it a moment and try again.";
    console.error("Claude API: rate limited");
  } else if (err instanceof Anthropic.APIError) {
    console.error(`Claude API error: status ${err.status ?? "unknown"}`);
  } else if (err instanceof Error && /authentication method|api key/i.test(err.message)) {
    // SDK throws before sending when no credentials are configured.
    status = 500;
    message = "The server's Anthropic API key isn't configured.";
    console.error("Claude API: no credentials configured");
  } else {
    console.error(`Reflection failed: ${err instanceof Error ? err.name : "unknown error"}`);
  }

  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

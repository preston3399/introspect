import type { Entry } from "./types";

// Session-only by design: reflections live in this browser tab's sessionStorage, which the
// browser discards when the tab closes. Nothing is stored on the server or shared between visitors.
// A reload keeps the session; a new tab or a closed tab starts fresh.
const KEY = "introspect_session";

export function loadEntries(): Entry[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: Entry[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage full or blocked — keep working in memory.
  }
}

/** Clear anything an earlier build left in persistent localStorage. */
export function purgeLegacyStorage(): void {
  try {
    localStorage.removeItem("introspect_entries");
  } catch {
    // ignore
  }
}

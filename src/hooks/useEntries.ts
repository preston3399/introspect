"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadEntries, purgeLegacyStorage, saveEntries } from "@/lib/storage";
import type { ApiError, DigResponse, Entry, ReflectResponse } from "@/lib/types";

export type Pending = { entryId: string } | null;
export type Failure = { entryId: string; message: string; retryable: boolean } | null;

class ApiRequestError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data as ApiError | null;
    throw new ApiRequestError(err?.error ?? "Something went wrong. Try again.", err?.limit !== "daily");
  }
  return data as T;
}

/** Entry list + the reflect / dig deeper / resolve actions, persisted locally. */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [failure, setFailure] = useState<Failure>(null);
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    // Hydrate from this tab's session after mount (storage isn't available during SSR).
    purgeLegacyStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(loadEntries());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveEntries(entries);
  }, [entries, loaded]);

  const update = useCallback((id: string, fn: (e: Entry) => Entry) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? fn(e) : e)));
  }, []);

  /** Ask for the agent's reply to the entry's trailing user message. Used for first reply, follow-ups, and retries. */
  const requestReply = useCallback(
    async (entry: Entry) => {
      setPending({ entryId: entry.id });
      setFailure(null);
      try {
        const isFirst = entry.exchanges.length === 1;
        if (isFirst) {
          const r = await post<ReflectResponse>("/api/reflect", { text: entry.exchanges[0].text });
          update(entry.id, (e) => ({
            ...e,
            emotion: r.emotion,
            title: r.title || e.title,
            crisis: e.crisis || r.crisis,
            exchanges: [...e.exchanges, { role: "agent", text: r.insight }],
          }));
        } else {
          const r = await post<DigResponse>("/api/dig", { exchanges: entry.exchanges });
          update(entry.id, (e) => ({
            ...e,
            crisis: e.crisis || r.crisis,
            exchanges: [...e.exchanges, { role: "agent", text: r.insight }],
          }));
        }
      } catch (err) {
        setFailure({
          entryId: entry.id,
          message: err instanceof Error ? err.message : String(err),
          retryable: !(err instanceof ApiRequestError) || err.retryable,
        });
      } finally {
        setPending(null);
      }
    },
    [update],
  );

  /** Start a new reflection; returns its id immediately so the UI can switch to the thread. */
  const reflect = useCallback(
    (text: string) => {
      const entry: Entry = {
        id: uid(),
        createdAt: Date.now(),
        emotion: null,
        title: text.slice(0, 40),
        resolved: false,
        exchanges: [{ role: "user", text }],
      };
      setEntries((prev) => [entry, ...prev]);
      void requestReply(entry);
      return entry.id;
    },
    [requestReply],
  );

  const digDeeper = useCallback(
    (id: string, text: string) => {
      const current = entriesRef.current.find((e) => e.id === id);
      if (!current) return;
      const next: Entry = { ...current, exchanges: [...current.exchanges, { role: "user", text }] };
      update(id, () => next);
      void requestReply(next);
    },
    [update, requestReply],
  );

  const retry = useCallback(
    (id: string) => {
      const current = entriesRef.current.find((e) => e.id === id);
      if (current) void requestReply(current);
    },
    [requestReply],
  );

  const setResolved = useCallback(
    (id: string, resolved: boolean) => update(id, (e) => ({ ...e, resolved })),
    [update],
  );

  return { entries, pending, failure, reflect, digDeeper, retry, setResolved };
}

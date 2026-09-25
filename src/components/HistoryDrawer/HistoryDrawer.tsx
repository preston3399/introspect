"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EMOTIONS, EMOTION_LABEL, type Emotion, type Entry } from "@/lib/types";
import styles from "./HistoryDrawer.module.css";

type Filter = "all" | Emotion;

type HistoryDrawerProps = {
  open: boolean;
  entries: Entry[];
  activeEntryId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

function formatWhen(ts: number): string {
  const d = new Date(ts);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Today · ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}

export function HistoryDrawer({ open, entries, activeEntryId, onSelect, onClose }: HistoryDrawerProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes; focus moves into the drawer when it opens.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const counts = useMemo(() => {
    const c: Partial<Record<Emotion, number>> = {};
    for (const e of entries) if (e.emotion) c[e.emotion] = (c[e.emotion] ?? 0) + 1;
    return c;
  }, [entries]);

  const list = useMemo(
    () =>
      entries
        .filter((e) => filter === "all" || e.emotion === filter)
        .sort((a, b) => b.createdAt - a.createdAt),
    [entries, filter],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className={styles.scrim}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
          <motion.aside
            key="drawer"
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className={styles.head}>
              <h2 id="history-title" className={`${styles.title} display`}>
                Your Introspections
              </h2>
              <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <p className={styles.sessionNote}>Kept in this tab only. Closing it clears them.</p>

            <div className={styles.chips} role="group" aria-label="Filter by emotion">
              <button
                type="button"
                className={styles.chip}
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                All
                <span className={styles.count}>{entries.length}</span>
              </button>
              {EMOTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={styles.chip}
                  aria-pressed={filter === em}
                  onClick={() => setFilter(em)}
                  style={{ "--tag-color": `var(--${em})` } as React.CSSProperties}
                >
                  <span className={styles.dot} />
                  {EMOTION_LABEL[em]}
                  {counts[em] ? <span className={styles.count}>{counts[em]}</span> : null}
                </button>
              ))}
            </div>

            <ul className={styles.list}>
              {list.length === 0 ? (
                <li className={styles.empty}>
                  {entries.length === 0
                    ? "No reflections yet. Once you reflect on something, it'll show up here, sorted by emotion."
                    : `Nothing tagged ${EMOTION_LABEL[filter as Emotion].toLowerCase()} yet.`}
                </li>
              ) : (
                list.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={styles.item}
                      data-resolved={entry.resolved || undefined}
                      aria-current={entry.id === activeEntryId ? "true" : undefined}
                      onClick={() => onSelect(entry.id)}
                    >
                      <span className={styles.meta}>
                        {entry.emotion ? (
                          <span
                            className={styles.metaTag}
                            style={{ "--tag-color": `var(--${entry.emotion})` } as React.CSSProperties}
                          >
                            <span className={styles.dot} />
                            {EMOTION_LABEL[entry.emotion]}
                          </span>
                        ) : (
                          <span className={styles.metaTag}>Waiting for insight</span>
                        )}
                        {entry.resolved && (
                          <span className={styles.resolvedMark}>
                            <svg viewBox="0 0 16 16" aria-hidden>
                              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Resolved
                          </span>
                        )}
                      </span>
                      <span className={styles.itemTitle}>{entry.title}</span>
                      <span className={styles.when}>{formatWhen(entry.createdAt)}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

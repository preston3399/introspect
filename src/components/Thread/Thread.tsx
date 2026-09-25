"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Orb } from "@/components/Orb/Orb";
import { InputBar } from "@/components/InputBar/InputBar";
import { PillButton } from "@/components/ui/PillButton";
import { EmotionTag } from "@/components/ui/EmotionTag";
import { SupportCard } from "./SupportCard";
import { useDictation } from "@/hooks/useDictation";
import type { Entry } from "@/lib/types";
import styles from "./Thread.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE },
};

type ThreadProps = {
  entry: Entry;
  pending: boolean;
  failure: { message: string; retryable: boolean } | null;
  onDigDeeper: (text: string) => void;
  onRetry: () => void;
  onResolve: () => void;
  /** True during the brief hold after tapping Resolve, before returning to the composer. */
  resolving: boolean;
  onReopen: () => void;
  onNewReflection: () => void;
};

export function Thread({
  entry,
  pending,
  failure,
  onDigDeeper,
  onRetry,
  onResolve,
  resolving,
  onReopen,
  onNewReflection,
}: ThreadProps) {
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const dictation = useDictation(setText);
  const { listening } = dictation;

  const lastRole = entry.exchanges.at(-1)?.role;
  const hasReply = entry.exchanges.some((ex) => ex.role === "agent");
  const busy = pending || lastRole === "user";

  // New insight → bring its first line into view. Waiting / error / resolved → scroll to the bottom.
  useEffect(() => {
    if (lastRole === "agent" && !entry.resolved) {
      latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      const el = scrollRef.current;
      el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [entry.exchanges.length, entry.resolved, lastRole, pending, failure]);

  const toggleDictation = () => {
    if (!dictation.supported) {
      setNotice("Voice input isn't supported in this browser.");
      return;
    }
    setNotice(null);
    dictation.toggle(text);
  };

  const submit = () => {
    const value = text.trim();
    if (busy) return;
    if (!value) {
      inputRef.current?.focus();
      return;
    }
    dictation.stop();
    setText("");
    onDigDeeper(value);
  };

  const resolve = () => {
    dictation.stop();
    onResolve();
  };

  return (
    <div className={styles.thread} data-listening={listening || undefined}>
      <div className={styles.scrollWrap}>
        <div ref={scrollRef} className={styles.scroll}>

          {entry.exchanges.map((ex, i) => {
            const isLatest = i === entry.exchanges.length - 1;
            return ex.role === "user" ? (
              <motion.div key={i} className={styles.userBubble} {...fadeUp}>
                {ex.text}
              </motion.div>
            ) : (
              <motion.div key={i} ref={isLatest ? latestRef : undefined} className={styles.insight} {...fadeUp}>
                {i === 1 && entry.emotion && <EmotionTag emotion={entry.emotion} />}
                <p className={`${styles.insightText} display`}>{ex.text}</p>
              </motion.div>
            );
          })}

          {entry.crisis && (
            <motion.div {...fadeUp}>
              <SupportCard />
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {pending && (
              <motion.div
                key="thinking"
                className={styles.thinking}
                role="status"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <Orb size={hasReply ? 56 : 88} glow thinking />
                <span className={styles.thinkingLabel}>{hasReply ? "Thinking it through…" : "Reflecting…"}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {failure && !pending && (
            <motion.div className={styles.error} role="alert" {...fadeUp}>
              <p>{failure.message}</p>
              {failure.retryable && (
                <button type="button" className={styles.textBtn} onClick={onRetry}>
                  Try again
                </button>
              )}
            </motion.div>
          )}

          <AnimatePresence>
            {entry.resolved && (
              <motion.div
                key="resolved"
                className={styles.resolvedBadge}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
              >
                <svg viewBox="0 0 16 16" aria-hidden>
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Resolved
              </motion.div>
            )}
          </AnimatePresence>

          {!pending && !entry.resolved && (
            <button type="button" className={`${styles.textBtn} ${styles.newLink}`} onClick={onNewReflection}>
              Start a new reflection
            </button>
          )}
        </div>

        <AnimatePresence>
          {listening && (
            <motion.div
              key="voice"
              className={styles.voiceLayer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.button
                type="button"
                className={styles.voiceOrb}
                onClick={dictation.stop}
                aria-label="Stop dictation"
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.6 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <Orb size="var(--big-orb)" glow />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {entry.resolved && !resolving ? (
        <div className={`${styles.dock} glass-stage`}>
          <p className={styles.resolvedNote}>You marked this one resolved.</p>
          <div className={styles.actions}>
            <PillButton size="md" onClick={onNewReflection}>
              Start fresh
            </PillButton>
            <PillButton size="md" variant="resolve" onClick={onReopen}>
              Reopen
            </PillButton>
          </div>
        </div>
      ) : (
        <div className={`${styles.dock} glass-stage`}>
          {notice && <p className={styles.notice}>{notice}</p>}
          <InputBar
            id="dig"
            ref={inputRef}
            label="Say more to dig deeper"
            placeholder="Say more about it..."
            value={text}
            onChange={setText}
            onSubmit={submit}
            listening={listening}
            dictationSupported={dictation.supported}
            onToggleDictation={toggleDictation}
          />
          <div className={styles.actions}>
            <PillButton size="md" onClick={submit} disabled={busy || entry.resolved}>
              Dig deeper
            </PillButton>
            <PillButton size="md" variant="resolve" onClick={resolve} disabled={!hasReply || busy || entry.resolved}>
              Resolve
            </PillButton>
          </div>
        </div>
      )}
    </div>
  );
}

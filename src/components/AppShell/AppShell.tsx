"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LaunchScreen } from "@/components/LaunchScreen/LaunchScreen";
import { TopBar } from "@/components/TopBar/TopBar";
import { Composer } from "@/components/Composer/Composer";
import { Thread } from "@/components/Thread/Thread";
import { HistoryDrawer } from "@/components/HistoryDrawer/HistoryDrawer";
import { useEntries } from "@/hooks/useEntries";
import styles from "./AppShell.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;
/** How long the "Resolved" badge holds before the thread leaves. */
const RESOLVE_HOLD_MS = 900;

type View = { screen: "compose" } | { screen: "thread"; entryId: string };

export function AppShell() {
  const [splash, setSplash] = useState(true);
  const [view, setView] = useState<View>({ screen: "compose" });
  const { entries, pending, failure, reflect, digDeeper, retry, setResolved } = useEntries();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const resolveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const historyButtonRef = useRef<HTMLButtonElement>(null);

  const endSplash = useCallback(() => setSplash(false), []);
  useEffect(() => () => clearTimeout(resolveTimer.current), []);

  const entry = view.screen === "thread" ? entries.find((e) => e.id === view.entryId) : undefined;

  const goCompose = () => {
    clearTimeout(resolveTimer.current);
    setResolvingId(null);
    setView({ screen: "compose" });
  };

  const closeHistory = useCallback(() => {
    setHistoryOpen(false);
    historyButtonRef.current?.focus();
  }, []);

  const openEntry = (id: string) => {
    clearTimeout(resolveTimer.current);
    setResolvingId(null);
    setView({ screen: "thread", entryId: id });
    setHistoryOpen(false);
  };

  const handleReflect = (text: string) => {
    const id = reflect(text);
    setView({ screen: "thread", entryId: id });
  };

  const handleResolve = (id: string) => {
    setResolved(id, true);
    setResolvingId(id);
    resolveTimer.current = setTimeout(goCompose, RESOLVE_HOLD_MS);
  };

  return (
    <div className={styles.frame}>
      <div className={styles.app}>
        <motion.div
          className={styles.screen}
          initial={{ opacity: 0, y: 8 }}
          animate={splash ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
        >
          <TopBar
            onOpenHistory={() => setHistoryOpen(true)}
            historyButtonRef={historyButtonRef}
            historyOpen={historyOpen}
          />

          <AnimatePresence mode="wait" initial={false}>
            {entry ? (
              <motion.div
                key={`thread-${entry.id}`}
                className={styles.view}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -28, transition: { duration: 0.45, ease: EASE } }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <Thread
                  entry={entry}
                  pending={pending?.entryId === entry.id}
                  failure={failure?.entryId === entry.id ? failure : null}
                  onDigDeeper={(text) => digDeeper(entry.id, text)}
                  onRetry={() => retry(entry.id)}
                  onResolve={() => handleResolve(entry.id)}
                  resolving={resolvingId === entry.id}
                  onReopen={() => setResolved(entry.id, false)}
                  onNewReflection={goCompose}
                />
              </motion.div>
            ) : (
              <motion.div
                key="compose"
                className={styles.view}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <Composer onReflect={handleReflect} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <HistoryDrawer
          open={historyOpen}
          entries={entries}
          activeEntryId={entry?.id ?? null}
          onSelect={openEntry}
          onClose={closeHistory}
        />

        <AnimatePresence>{splash && <LaunchScreen key="splash" onDone={endSplash} />}</AnimatePresence>
      </div>
    </div>
  );
}

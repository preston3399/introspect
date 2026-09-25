/* eslint-disable @next/next/no-img-element */
import type { Ref } from "react";
import styles from "./TopBar.module.css";

type TopBarProps = {
  onOpenHistory: () => void;
  historyButtonRef?: Ref<HTMLButtonElement>;
  historyOpen?: boolean;
};

export function TopBar({ onOpenHistory, historyButtonRef, historyOpen }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <img className={styles.wordmark} src="/brand/wordmark-horizontal.png" alt="Introspect" />
      <button
        ref={historyButtonRef}
        className={styles.iconBtn}
        onClick={onOpenHistory}
        aria-label="Your Introspections"
        aria-haspopup="dialog"
        aria-expanded={historyOpen}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
          <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
        </svg>
      </button>
    </header>
  );
}

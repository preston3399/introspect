"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Orb } from "@/components/Orb/Orb";
import styles from "./InputBar.module.css";

const MAX_INPUT_HEIGHT = 140;

type InputBarProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  listening: boolean;
  dictationSupported: boolean;
  onToggleDictation: () => void;
};

/** Pill input with the inline mic + mini orb toggle. Grows with text, typed or dictated. */
export const InputBar = forwardRef<HTMLTextAreaElement, InputBarProps>(function InputBar(
  { id, label, placeholder, value, onChange, onSubmit, listening, dictationSupported, onToggleDictation },
  ref,
) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLTextAreaElement);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
    // While dictating, keep the newest words in view as they're typed in.
    if (listening) el.scrollTop = el.scrollHeight;
  }, [value, listening]);

  return (
    <div className={styles.bar} data-listening={listening || undefined}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <textarea
        id={id}
        ref={inputRef}
        className={styles.input}
        rows={1}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
        }}
      />

      <button
        type="button"
        className={styles.micBtn}
        data-active={listening || undefined}
        data-unsupported={!dictationSupported || undefined}
        onClick={onToggleDictation}
        aria-label={listening ? "Stop dictation" : "Start dictation"}
        aria-pressed={listening}
      >
        <span className={styles.micGlyph} />
      </button>

      <AnimatePresence initial={false}>
        {!listening && (
          <motion.button
            key="mini-orb"
            type="button"
            className={styles.miniOrbBtn}
            onClick={onToggleDictation}
            aria-label="Start dictation"
            initial={{ opacity: 0, width: 0, scale: 0.5 }}
            animate={{ opacity: 1, width: 38, scale: 1 }}
            exit={{ opacity: 0, width: 0, scale: 0.5 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Orb size={32} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

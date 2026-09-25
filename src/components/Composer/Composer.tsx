"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Orb } from "@/components/Orb/Orb";
import { InputBar } from "@/components/InputBar/InputBar";
import { PillButton } from "@/components/ui/PillButton";
import { useDictation } from "@/hooks/useDictation";
import styles from "./Composer.module.css";

type ComposerProps = {
  onReflect: (text: string) => void;
};

export function Composer({ onReflect }: ComposerProps) {
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dictation = useDictation(setText);
  const { listening } = dictation;

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
    if (!value) {
      inputRef.current?.focus();
      return;
    }
    dictation.stop();
    onReflect(value);
  };

  return (
    <div className={styles.composer} data-listening={listening || undefined}>
      <p className={styles.intro}>
        Tell it how you feel.
        <br />
        It offers one possible reason why.
        <br />
        Not therapy, just a starting point
        <br />
        you can dig deeper into.
      </p>

      <div className={styles.stage}>
        <h1 className={`${styles.headline} display`}>What’s on your mind right now?</h1>

        <div className={styles.orbSlot}>
          <AnimatePresence>
            {listening && (
              <motion.button
                key="orb"
                type="button"
                className={styles.bigOrb}
                onClick={dictation.stop}
                aria-label="Stop dictation"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <Orb size="var(--big-orb)" glow />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={`${styles.bottom} glass-stage`}>
        <p className="visually-hidden" role="status" aria-live="polite">
          {listening ? "Listening" : ""}
        </p>
        {notice && <p className={styles.notice}>{notice}</p>}

        <InputBar
          id="feel"
          ref={inputRef}
          label="What’s on your mind right now?"
          placeholder="I feel like..."
          value={text}
          onChange={setText}
          onSubmit={submit}
          listening={listening}
          dictationSupported={dictation.supported}
          onToggleDictation={toggleDictation}
        />

        <PillButton onClick={submit}>Reflect</PillButton>
      </div>
    </div>
  );
}

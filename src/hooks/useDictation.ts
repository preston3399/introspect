"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal typings for the Web Speech API (not in lib.dom for all TS versions).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognizerCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

/**
 * Speech-to-text that appends to existing text.
 * `onText` receives the full combined value (existing text + final + interim) on every result.
 */
export function useDictation(onText: (value: string) => void) {
  // Server render has no speech API; the client snapshot is stable after hydration.
  const supported = useSyncExternalStore(noopSubscribe, () => getRecognizerCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const start = useCallback((currentText: string) => {
    const Ctor = getRecognizerCtor();
    if (!Ctor || recognitionRef.current) return;

    const base = currentText.trim() ? currentText.trim() + " " : "";
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";

    r.onresult = (e) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      onTextRef.current((base + finalText + interim).trim());
    };
    const finish = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    r.onerror = finish;
    r.onend = finish;

    try {
      r.start();
      recognitionRef.current = r;
      setListening(true);
    } catch {
      finish();
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(
    (currentText: string) => (recognitionRef.current ? stop() : start(currentText)),
    [start, stop],
  );

  return { supported, listening, start, stop, toggle };
}

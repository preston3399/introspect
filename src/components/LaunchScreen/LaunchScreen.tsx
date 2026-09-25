"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import styles from "./LaunchScreen.module.css";

const SPLASH_MS = 1500;

type LaunchScreenProps = {
  onDone: () => void;
};

export function LaunchScreen({ onDone }: LaunchScreenProps) {
  useEffect(() => {
    const t = setTimeout(onDone, SPLASH_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className={styles.splash}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.img
        className={styles.lockup}
        src="/brand/lockup-vertical.png"
        alt="Introspect"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ scale: 1.03 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}

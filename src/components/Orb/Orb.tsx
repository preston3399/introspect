import type { CSSProperties } from "react";
import styles from "./Orb.module.css";

type OrbProps = {
  /** Diameter: px number, or any CSS length (e.g. a clamp()) for responsive sizing. */
  size: number | string;
  /** Ambient halo + breathing. Off for the small inline toggle. */
  glow?: boolean;
  /** Quicker pulse while waiting on a response. */
  thinking?: boolean;
  className?: string;
};

/**
 * The Introspect voice orb: a soft red/coral/bone plasma that drifts slowly.
 * Palette follows the prototype's mic swirl (red → white → bone), but paced to breathe, not spin.
 */
export function Orb({ size, glow = false, thinking = false, className }: OrbProps) {
  const orbSize = typeof size === "number" ? `${size}px` : size;
  return (
    <div
      className={[styles.orb, glow && styles.glow, thinking && styles.thinking, className].filter(Boolean).join(" ")}
      style={{ "--orb-size": orbSize } as CSSProperties}
      aria-hidden
    >
      <div className={styles.body}>
        <span className={`${styles.blob} ${styles.blobRed}`} />
        <span className={`${styles.blob} ${styles.blobPale}`} />
        <span className={`${styles.blob} ${styles.blobDeep}`} />
        <span className={styles.rim} />
      </div>
    </div>
  );
}

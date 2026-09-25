import { EMOTION_LABEL, type Emotion } from "@/lib/types";
import styles from "./EmotionTag.module.css";

export function EmotionTag({ emotion }: { emotion: Emotion }) {
  return (
    <span className={styles.tag} style={{ "--tag-color": `var(--${emotion})` } as React.CSSProperties}>
      <span className={styles.dot} />
      {EMOTION_LABEL[emotion]}
    </span>
  );
}

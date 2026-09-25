import styles from "./SupportCard.module.css";

/** Shown whenever a reply flags possible risk of harm. Fixed copy, independent of the model's wording. */
export function SupportCard() {
  return (
    <aside className={styles.card} aria-labelledby="support-title">
      <h2 id="support-title" className={`${styles.title} display`}>
        You don’t have to hold this alone
      </h2>
      <p className={styles.body}>
        If you’re thinking about hurting yourself or someone else, please reach out to someone now. In the US, the
        988 Suicide &amp; Crisis Lifeline is free and open 24/7.
      </p>
      <div className={styles.actions}>
        <a className={styles.action} href="tel:988">
          Call 988
        </a>
        <a className={styles.action} href="sms:988">
          Text 988
        </a>
      </div>
      <p className={styles.fine}>
        Outside the US, find a local line at{" "}
        <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">
          findahelpline.com
        </a>
        . If you’re in immediate danger, call your local emergency number.
      </p>
    </aside>
  );
}

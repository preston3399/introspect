import type { ButtonHTMLAttributes } from "react";
import styles from "./PillButton.module.css";

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "reflect" | "resolve";
  /** "lg" matches the Reflect mockup; "md" fits two side by side. */
  size?: "lg" | "md";
};

/** Solid pill with a serif label — matches Reflect_Button.png / Resolve_Button.png. */
export function PillButton({ variant = "reflect", size = "lg", className, ...rest }: PillButtonProps) {
  return (
    <button
      type="button"
      className={[styles.pill, styles[variant], styles[size], "display", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

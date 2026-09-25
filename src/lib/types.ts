export const EMOTIONS = ["happiness", "sadness", "fear", "anger", "shame"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const EMOTION_LABEL: Record<Emotion, string> = {
  happiness: "Happiness",
  sadness: "Sadness",
  fear: "Fear",
  anger: "Anger",
  shame: "Shame",
};

export type Exchange = {
  role: "user" | "agent";
  text: string;
};

export type Entry = {
  id: string;
  createdAt: number;
  /** Null until the first insight comes back. */
  emotion: Emotion | null;
  title: string;
  resolved: boolean;
  /** Set once any reply flags possible risk of harm; keeps the support card visible for this entry. */
  crisis?: boolean;
  /** Alternates user → agent. A trailing user exchange means a reply is pending or failed. */
  exchanges: Exchange[];
};

/** POST /api/reflect */
export type ReflectRequest = { text: string };
export type ReflectResponse = { insight: string; emotion: Emotion; title: string; crisis: boolean };

/** POST /api/dig */
export type DigRequest = { exchanges: Exchange[] };
export type DigResponse = { insight: string; crisis: boolean };

/** `limit` is set when a rate or budget limit was hit. The daily cap won't clear until tomorrow. */
export type ApiError = { error: string; limit?: "visitor" | "daily" };

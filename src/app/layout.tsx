import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Introspect",
  description:
    "Tell it how you feel. It offers one possible reason why — not therapy, just a starting point you can dig deeper into.",
  // Added to an iPhone home screen, open full-screen with content drawn under the status bar;
  // the app's safe-area padding keeps it clear of the notch / Dynamic Island.
  appleWebApp: { capable: true, title: "Introspect", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw edge to edge on notched phones; layout pads with the safe-area insets.
  viewportFit: "cover",
  // Android: shrink the layout when the keyboard opens so the input bar stays visible.
  interactiveWidget: "resizes-content",
  themeColor: "#131314",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/Fraunces-Variable.ttf" as="font" type="font/ttf" crossOrigin="" />
        <link rel="preload" href="/fonts/WorkSans-Variable.ttf" as="font" type="font/ttf" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}

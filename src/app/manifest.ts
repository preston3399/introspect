import type { MetadataRoute } from "next";

// Lets Android / Chrome "Install app" open Introspect full-screen with brand colors.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Introspect",
    short_name: "Introspect",
    description: "Tell it how you feel. It offers one possible reason why.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#131314",
    theme_color: "#131314",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}

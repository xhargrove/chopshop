import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        accent: "var(--color-accent)",
        "text-primary": "var(--color-text-primary)",
        "text-muted": "var(--color-text-muted)",
      },
      fontFamily: {
        body: ["var(--font-instrument-sans)", "sans-serif"],
        display: ["var(--font-bebas-neue)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      fontSize: {
        "drop-title": ["2rem", { lineHeight: "2.25rem", letterSpacing: "0.04em" }],
      },
      minHeight: {
        dropzone: "15rem",
      },
      borderRadius: {
        dropzone: "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;

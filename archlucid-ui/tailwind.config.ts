import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  safelist: ["bg-teal-800", "hover:bg-teal-900", "dark:bg-teal-800", "dark:hover:bg-teal-900"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1E3A5F",
          cyan: "#00AEEF",
        },
        al: {
          "surface-base": "var(--al-surface-base)",
          "surface-raised": "var(--al-surface-raised)",
          "surface-overlay": "var(--al-surface-overlay)",
          "accent-interactive": "var(--al-accent-interactive)",
          "accent-border-focus": "var(--al-accent-border-focus)",
          "text-primary": "var(--al-text-primary)",
          "text-secondary": "var(--al-text-secondary)",
          "text-placeholder": "var(--al-text-placeholder)",
          "text-disabled": "var(--al-text-disabled)",
        },
      },
    },
  },
  plugins: [],
};

export default config;

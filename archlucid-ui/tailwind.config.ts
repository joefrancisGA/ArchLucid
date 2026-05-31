import type { Config } from "tailwindcss";

const alColor = (cssVar: string) => `rgb(var(${cssVar}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
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

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "rgb(var(--color-page) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        line: "rgb(var(--color-border) / <alpha-value>)",
        ink: "rgb(var(--color-text) / <alpha-value>)",
        steel: "rgb(var(--color-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accentHover: "rgb(var(--color-accent-hover) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        amber: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        cloud: "rgb(var(--color-elevated) / <alpha-value>)"
      },
      boxShadow: {
        panel: "0 14px 40px rgba(0,0,0,0.18)"
      }
    }
  },
  plugins: []
};

export default config;
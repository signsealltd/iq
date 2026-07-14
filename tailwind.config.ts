import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        steel: "#52616f",
        mint: "#3b8f7b",
        amber: "#b87924",
        cloud: "#f5f7f8",
        line: "#d8dee4"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(23,32,42,0.08)"
      }
    }
  },
  plugins: []
};

export default config;

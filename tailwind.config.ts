import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#00C9A7",
          hover: "#00a88c",
        },
        surface: {
          0: "#0a0a0a",
          1: "#0f0f0f",
          2: "#111111",
          3: "#141414",
        },
        border: {
          subtle: "#1a1a1a",
          default: "#222222",
          hover: "#333333",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
      },
      letterSpacing: {
        label: "0.05em",
      },
    },
  },
  plugins: [],
};

export default config;

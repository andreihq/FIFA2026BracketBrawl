import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-bebas)", "Bebas Neue", "sans-serif"],
        sans: ["var(--font-outfit)", "Outfit", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        pitch: {
          950: "#07090F",
          900: "#0D1320",
          800: "#131C2E",
          700: "#192436",
          600: "#1E2E43",
          500: "#2A3F5A",
          400: "#3D4F6E",
          300: "#6B7FA0",
          200: "#A0B0CC",
        },
        gold: {
          DEFAULT: "#F5A623",
          hover:   "#FFB83D",
          dim:     "#8B6019",
        },
      },
      backgroundImage: {
        "pitch-grid":
          "linear-gradient(rgba(245,166,35,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "pitch-grid": "64px 64px",
      },
    },
  },
  plugins: [],
};
export default config;

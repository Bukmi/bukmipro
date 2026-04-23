import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        graphite: {
          DEFAULT: "#1F1F1F",
          soft: "#262626",
          line: "#333333",
        },
        paper: {
          DEFAULT: "#F2F2F2",
          dim: "#C9C9C9",
          mute: "#8A8A8A",
        },
        accent: {
          DEFAULT: "#E7FF52",
          ink: "#1F1F1F",
        },
        danger: { DEFAULT: "#FF6B6B" },
        success: { DEFAULT: "#3DDC97" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      fontSize: {
        display: ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "800" }],
        hero: ["clamp(2rem, 4vw, 3.25rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

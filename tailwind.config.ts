import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0055A4",
          dark: "#003D7A",
          light: "#E6F0FA",
          50: "#F0F6FC",
        },
        background: {
          DEFAULT: "#FFFFFF",
          secondary: "#F4F6F9",
          tertiary: "#EEF1F6",
        },
        border: {
          DEFAULT: "#E2E8F0",
          light: "#F1F5F9",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          tertiary: "#94A3B8",
        },
        status: {
          safe: "#16A34A",
          "safe-light": "#DCFCE7",
          warning: "#F59E0B",
          "warning-light": "#FEF3C7",
          danger: "#DC2626",
          "danger-light": "#FEE2E2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        button: "0 2px 8px 0 rgba(0, 85, 164, 0.28)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 4px 12px 0 rgba(15, 23, 42, 0.08)",
        nav: "0 -4px 24px 0 rgba(15, 23, 42, 0.08)",
        fab: "0 4px 16px 0 rgba(0, 85, 164, 0.4)",
        sheet: "0 -8px 32px 0 rgba(15, 23, 42, 0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        shake: "shake 0.4s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

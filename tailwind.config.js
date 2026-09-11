/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', "sans-serif"],
        serif: ['"Noto Serif KR"', "serif"],
      },
      colors: {
        brand: {
          50: "#FFFBEB",
          100: "#FFF3C4",
          200: "#FFE38A",
          300: "#FFD66B",
          400: "#FFC94A",
          500: "#F5B82E",
          600: "#D99A12",
          700: "#B98200",
          800: "#8A6200",
          900: "#604300",
          950: "#604300",
        },
        darkness: "#111111",
      },
      borderRadius: { md: "6px", lg: "12px" },
      lineHeight: { 6: "1.6" },
      letterSpacing: { widest: "0.1em" },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.12)",
        md: "0 6px 14px rgba(0,0,0,0.15)",
        xl: "0 14px 28px rgba(0,0,0,0.2)",
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "fade-in": "fadeIn 1.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

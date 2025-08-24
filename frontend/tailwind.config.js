/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgba(35, 31, 32, 0.15)",
        input: "transparent",
        ring: "#ff6600",
        background: "#ffffff",
        foreground: "#231F20",
        primary: {
          DEFAULT: "#ff6600",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#231F20",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#EE3D42",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#EE3D42",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f8f9fa",
          foreground: "#4A4A4A",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#231F20",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#231F20",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
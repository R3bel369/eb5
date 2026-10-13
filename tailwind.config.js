/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shoora EB-5 Brand Palette
        navy: {
          50:  "#eef2f9",
          100: "#d5e0f0",
          200: "#abc2e1",
          300: "#7a9ece",
          400: "#4e7abb",
          500: "#2c5ba8",
          600: "#1e4589",
          700: "#163368",
          800: "#0f2349",
          900: "#081530",
          950: "#040b1e",
        },
        gold: {
          50:  "#fdf9ec",
          100: "#f9f0cc",
          200: "#f3df96",
          300: "#ecc85a",
          400: "#e6b22e",
          500: "#d49a16",
          600: "#b97b10",
          700: "#965910",
          800: "#7a4613",
          900: "#663a14",
        },
        ivory: {
          50:  "#fefdfb",
          100: "#fdf9f4",
          200: "#faf3e8",
          300: "#f5e8d0",
          400: "#eed6b0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(8, 21, 48, 0.08), 0 1px 4px 0 rgba(8, 21, 48, 0.04)",
        "card-hover": "0 8px 32px 0 rgba(8, 21, 48, 0.14), 0 2px 8px 0 rgba(8, 21, 48, 0.08)",
        glass: "0 4px 32px 0 rgba(8, 21, 48, 0.12), inset 0 1px 0 rgba(255,255,255,0.1)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #040b1e 0%, #0f2349 40%, #163368 70%, #1e4589 100%)",
        "section-gradient": "linear-gradient(180deg, #f5e8d0 0%, #fefdfb 100%)",
        "gold-shimmer": "linear-gradient(90deg, #d49a16, #e6b22e, #ecc85a, #e6b22e, #d49a16)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
}

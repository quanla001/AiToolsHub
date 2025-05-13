/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/ui/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        blue: "#2997FF",
        gray: {
          DEFAULT: "#86868b",
          100: "#94928d",
          200: "#afafaf",
          300: "#42424570",
        },
        zinc: "#101010", // Custom color
        glowYellow: "#FFD700",
        glowBlue: "#4FC3F7",
      },
      fontFamily: {
        jersey: ['"Roboto"', "sans-serif"],
      },
      backgroundImage: {
        "hero-pattern": "url('/assets/images/banner-2.jpg')",
        "hero-pattern-1": "url('/assets/images/banner-3.jpg')",
        "hero-pattern-2": "url('/assets/images/banner-4.jpg')",
        "hero-pattern-3": "url('/assets/images/bg-home.jpg')",
        "glow-gradient":
          "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)",
        "blue-glow-gradient":
          "radial-gradient(rgba(41,151,255,0.5) 0%, rgba(41,151,255,0) 70%)",
        "red-glow-gradient":
          "radial-gradient( rgba(255,0,0,0.5) 0%, rgba(255,0,0,0) 70%)",
      },
      boxShadow: {
        "left-glow": "-10px 0px 20px 5px rgba(255, 255, 0, 0.5)",
      },
      blur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "32px",
      },
      keyframes: {
        "glow-animation": {
          "0%": { transform: "translate(-50%, -50%) scale(1)", opacity: "0.8" },
          "100%": {
            transform: "translate(-50%, -50%) scale(1.5)",
            opacity: "0.3",
          },
        },
      },
      animation: {
        "glow-animation": "glow-animation 6s infinite alternate",
      },
    },
  },
  plugins: [],
};

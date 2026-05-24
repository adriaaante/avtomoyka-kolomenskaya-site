/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090c",
          900: "#0b0f15",
          800: "#11161f",
          700: "#1a2230",
          600: "#2a3445",
          500: "#3a4658",
        },
        brass: {
          50: "#fbf6ea",
          100: "#f3e6bf",
          200: "#e8d28a",
          300: "#dabb5a",
          400: "#caa436",
          500: "#b48c1e",
          600: "#8f6c14",
          700: "#6b500f",
        },
      },
      fontFamily: {
        display: ['"Unbounded"', '"Manrope"', "system-ui", "sans-serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 30px 80px -20px rgba(202, 164, 54, 0.35)",
        card: "0 20px 50px -20px rgba(0, 0, 0, 0.6)",
      },
      backgroundImage: {
        "radial-spot":
          "radial-gradient(60% 50% at 50% 0%, rgba(202,164,54,0.18) 0%, rgba(7,9,12,0) 70%)",
        "grid-fade":
          "linear-gradient(to bottom, rgba(7,9,12,0) 0%, rgba(7,9,12,1) 90%)",
      },
      keyframes: {
        shine: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        shine: "shine 6s linear infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

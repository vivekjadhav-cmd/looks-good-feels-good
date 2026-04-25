import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          50: "#FAEEDA",
          200: "#FAC775",
          400: "#EF9F27",
          600: "#854F0B",
          800: "#633806",
        },
        sage: {
          50: "#E1F5EE",
          200: "#9FE1CB",
          400: "#1D9E75",
          600: "#0F6E56",
          800: "#085041",
        },
        blush: {
          50: "#FAECE7",
          200: "#F5C4B3",
          400: "#D85A30",
          600: "#993C1D",
          800: "#712B13",
        },
        neutral: {
          100: "#F5F3EE",
          200: "#E8E5DD",
          400: "#B5B2A9",
          600: "#6B6A65",
          800: "#2C2C2A",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        pill: "20px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(133, 79, 11, 0.08)",
        lifted: "0 4px 20px rgba(133, 79, 11, 0.12)",
      },
      fontSize: {
        "heading-lg": ["24px", { lineHeight: "1.2", fontWeight: "600" }],
        "heading-md": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-sm": ["16px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};

export default config;

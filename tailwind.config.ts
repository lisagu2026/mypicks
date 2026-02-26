import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f1f1f",
        paper: "#f6f4ef",
        line: "#dfdbd1",
        muted: "#6f6a5e",
        accent: "#2f5d50"
      }
    }
  },
  plugins: []
};

export default config;

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
        paper: "#f4f7fb",
        line: "#d9e1ec",
        muted: "#617082",
        accent: "#3a72b7"
      }
    }
  },
  plugins: []
};

export default config;

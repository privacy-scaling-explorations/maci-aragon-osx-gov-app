import type { Config } from "tailwindcss";
import { VotingMode } from "./plugins/maciVoting/utils/types";

const config: Config = {
  presets: [require("@aragon/ods/tailwind.config")],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./plugins/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@aragon/ods/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        voting: {
          yes: "#10b981",
          no: "#dc2626",
          abstain: "#94a3b8",
          slate: "#94a3b8",
        },
      },
    },
  },
};
export default config;

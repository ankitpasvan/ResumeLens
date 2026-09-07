import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
});

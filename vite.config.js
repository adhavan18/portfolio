import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// relative base so the same build works on Vercel and on GitHub Pages (/portfolio/)
export default defineConfig({ plugins: [react()], base: "./" });

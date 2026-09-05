import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Bản đóng gói nạp qua file://, nên asset phải dùng đường dẫn tương đối.
  base: "./",
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
});

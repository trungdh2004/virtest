import { defineConfig } from "vitest/config";

/**
 * Vitest hỗ trợ "projects" để chạy nhiều môi trường trong cùng 1 lệnh.
 *
 * - frontend: dùng jsdom (giả lập DOM cho React component tests)
 * - backend:  dùng node  (Node.js thuần cho service / API tests)
 */
export default defineConfig({
  test: {
    projects: [
      {
        // ── Frontend tests ──────────────────────────────────
        test: {
          name: "frontend",
          include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
          environment: "jsdom",
          globals: true,
        },
      },
      {
        // ── Backend / Service tests ──────────────────────────
        test: {
          name: "backend",
          include: ["tests/**/*.{test,spec}.{js,ts}"],
          environment: "node",
          globals: true,
        },
      },
    ],
  },
});

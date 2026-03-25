// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────
  { ignores: ["dist/", "node_modules/", ".angular/", "coverage/"] },

  // ── Base JS recommended rules ───────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript rules ────────────────────────────────────────────
  ...tseslint.configs.recommended,

  // ── Project-wide settings ───────────────────────────────────────
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // --- Security-relevant rules ---
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // --- Code quality ---
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],

      // --- TypeScript ---
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  }
);

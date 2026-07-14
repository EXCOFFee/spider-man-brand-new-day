import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: [
      "dist/",
      ".vercel/",
      ".astro/",
      "node_modules/",
      ".lighthouseci/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      // The IP and performance constraints make silent type holes expensive:
      // an `any` here is a bug, not a shortcut.
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Node-side tooling and build config: CLI output is the point, and Node
    // globals are expected.
    files: [
      "tests/**/*.{js,mjs}",
      "tools/**/*.{js,mjs}",
      "*.config.{js,mjs}",
      "*.mjs",
    ],
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
    rules: {
      "no-console": "off",
    },
  },
];

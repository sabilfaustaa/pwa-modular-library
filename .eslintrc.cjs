/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    // --- Hard constraint AGENT.md §3.2: no `any` in public API ---
    // Error di file types dan composables (public API)
    // Allow di internal implementation kalau ada komentar // eslint-disable-next-line
    "@typescript-eslint/no-explicit-any": "error",

    // --- Best practices ---
    "no-console": "off", // Logger handles this
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "warn",
  },
  overrides: [
    // Test files: relax rules
    {
      files: ["tests/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
    // Script files: relax rules
    {
      files: ["scripts/**/*.mjs"],
      parserOptions: { sourceType: "module" },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};

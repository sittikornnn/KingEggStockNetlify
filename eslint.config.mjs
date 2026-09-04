import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Standalone global ignore block
  {
    ignores: [
      ".next/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/out/**",
      "**/build/**",
      "**/coverage/**",
      "**/.vercel/**",
      "**/*.min.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable explicit 'any' rule
      "@typescript-eslint/no-explicit-any": "off",

      // Allow short-circuit and ternary expressions
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],

      // Ignore unused variables prefixed with an underscore
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
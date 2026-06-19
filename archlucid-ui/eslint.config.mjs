import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

import buyerReviewTerminology from "./eslint-rules/buyer-review-terminology.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "src/app/(operator)/**/*.{ts,tsx}",
      "src/app/(marketing)/**/*.{ts,tsx}",
      "src/app/(executive)/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
    ],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.generated.ts",
      "**/api-types.generated.ts",
      "**/help-index.generated.ts",
      "**/review-terminology-surfaces.ts",
    ],
    plugins: {
      "buyer-review-terminology": buyerReviewTerminology,
    },
    rules: {
      "buyer-review-terminology/no-run-primary-copy": "error",
    },
  },
];

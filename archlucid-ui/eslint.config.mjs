import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import buyerReviewTerminology from "./eslint-rules/buyer-review-terminology.mjs";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Next 16's eslint-config-next enables react-hooks v6 compiler rules that were not enforced under Next 15's `next lint`.
      // Disable here to keep this upgrade dependency-only; tighten in a follow-up pass.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/use-memo": "off",
    },
  },
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
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lighthouserc.cjs",
    "lighthouserc.acceptance.cjs",
    "scripts/lighthouse-acceptance-puppeteer.cjs",
  ]),
]);

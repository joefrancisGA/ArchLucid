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
      "src/components/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
    ],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.generated.ts",
      "**/api-types.generated.ts",
      "**/api-types/*.generated.ts",
      "**/help-index.generated.ts",
      "**/review-terminology-surfaces.ts",
    ],
    plugins: {
      "buyer-review-terminology": buyerReviewTerminology,
    },
    rules: {
      "buyer-review-terminology/no-run-primary-copy": "error",
      /**
       * Help must never live in a `title` attribute: browsers only reveal it on mouse hover, so
       * keyboard and touch users never see it, and screen-reader support is inconsistent. Use
       * `FieldHelpTooltip` / `HelpPopover` / visible helper copy instead (UI_DESIGN_SYSTEM.md
       * § Operator page contextual help). Scoped to native DOM elements so component props named
       * `title` (`<SectionCard title=…>`) still work; `iframe` is exempt because `title` is its
       * required accessible name.
       */
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'JSXOpeningElement[name.name=/^[a-z]/]:not([name.name="iframe"]) > JSXAttribute[name.name="title"]',
          message:
            "Do not put help text in a `title` attribute — it is hover-only and unreachable by keyboard and touch. Use FieldHelpTooltip, HelpPopover, or visible helper copy instead.",
        },
      ],
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

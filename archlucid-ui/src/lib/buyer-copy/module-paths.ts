/**
 * Repo-relative paths of every buyer copy surface module.
 *
 * Guards that scan copy as text (terminology, vocabulary, and concept-leakage sweeps) read these
 * paths rather than `@/lib/buyer/buyer-polish-copy`, which is a re-export barrel holding no literals.
 * Kept free of copy imports so those registries stay cheap to load.
 *
 * `./buyer-copy-module-registry.test.ts` fails when a module is added without registering it here.
 */
export const BUYER_COPY_MODULE_PATHS = [
  "src/lib/buyer-copy/ask.ts",
  "src/lib/buyer-copy/audit.ts",
  "src/lib/buyer-copy/cto-demo.ts",
  "src/lib/buyer-copy/evidence-graph.ts",
  "src/lib/buyer-copy/sponsor.ts",
  "src/lib/buyer-copy/glossary.ts",
  "src/lib/buyer-copy/governance.ts",
  "src/lib/buyer-copy/onboarding.ts",
  "src/lib/buyer-copy/operator-home.ts",
  "src/lib/buyer-copy/pricing.ts",
  "src/lib/buyer-copy/review-record.ts",
  "src/lib/buyer-copy/reviews-compare.ts",
  "src/lib/buyer-copy/reviews-list.ts",
  "src/lib/buyer-copy/reviews-new.ts",
  "src/lib/buyer-copy/showcase.ts",
  "src/lib/buyer-copy/workspace-scope.ts",
] as const;

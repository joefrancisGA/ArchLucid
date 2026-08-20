import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { REVIEW_LIFECYCLE_BANNED_COMMITTED_CHROME } from "@/lib/vocabulary/review-lifecycle-verb-map";

const CHROME_SOURCES = [
  "src/lib/operator/operator-home-recent-reviews-outcome.ts",
  "src/components/operator/OperatorStickinessSnapshotCard.tsx",
  "src/components/runs/RunTrustEvidenceCardSection.tsx",
  "src/app/(operator)/architecture/reviews/_sections/reviews-hub-deferred-chunks.tsx",
  "src/lib/vocabulary/ask-architecture-intelligence-vocabulary.ts",
  "src/lib/architecture/architecture-intelligence-page-copy.ts",
] as const;

const BANNED_CHROME_PATTERNS: readonly RegExp[] = [
  REVIEW_LIFECYCLE_BANNED_COMMITTED_CHROME,
  /\bgolden regression harness\b/i,
  /\boperator diagnostics\b/i,
  /Loading package includes/,
];

describe("tb-2353 chrome vocabulary guard (TB-2362)", () => {
  it("keeps banned engineering chrome out of live buyer surfaces", () => {
    for (const relativePath of CHROME_SOURCES) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      for (const pattern of BANNED_CHROME_PATTERNS) {
        expect(source, relativePath).not.toMatch(pattern);
      }
    }
  });
});

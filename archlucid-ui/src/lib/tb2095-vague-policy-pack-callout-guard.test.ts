/**
 * TB-2095 — forbid vague unnamed Deliverables policy-pack callouts.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

const FORBIDDEN_STRINGS = [
  "Policy pack used for this review.",
  "Policy pack used for this sample review.",
  "BUYER_REVIEW_DETAIL_POLICY_PACK_NOTE",
  "samplePolicyPackContextLine",
] as const;

const SCOPED_FILES = [
  "lib/buyer-polish-copy.ts",
  "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailArtifactsExportsSection.tsx",
  "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailBelowFoldSections.tsx",
  "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPageView.tsx",
] as const;

describe("TB-2095 vague Deliverables policy-pack callout guard", () => {
  it("forbids unnamed policy-pack diligence lines on review Deliverables wiring", () => {
    const violations: string[] = [];

    for (const relative of SCOPED_FILES) {
      const source = readFileSync(join(SRC, relative), "utf8");

      for (const needle of FORBIDDEN_STRINGS) {
        if (source.includes(needle)) {
          violations.push(`${relative}: ${needle}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

/**
 * TB-2095 — forbid vague unnamed Deliverables policy-pack callouts.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUYER_COPY_MODULE_PATHS } from "@/lib/buyer-copy/module-paths";

const FORBIDDEN_STRINGS = [
  "Policy pack used for this review.",
  "Policy pack used for this sample review.",
  "BUYER_REVIEW_DETAIL_POLICY_PACK_NOTE",
  "samplePolicyPackContextLine",
] as const;

const SCOPED_FILES = [
  ...BUYER_COPY_MODULE_PATHS,
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailArtifactsExportsSection.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailBelowFoldSections.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPageView.tsx",
] as const;

describe("TB-2095 vague Deliverables policy-pack callout guard", () => {
  it("forbids unnamed policy-pack diligence lines on review Deliverables wiring", () => {
    const violations: string[] = [];

    for (const relative of SCOPED_FILES) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");

      for (const needle of FORBIDDEN_STRINGS) {
        if (source.includes(needle)) {
          violations.push(`${relative}: ${needle}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

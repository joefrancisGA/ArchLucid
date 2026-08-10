import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BILLING_HELP_SOURCE_DRIFT_ANCHORS } from "@/lib/billing-help-guide-content";

const REPO_ROOT = join(process.cwd(), "..");
const BILLING_AND_PLANS_SOURCE_DOC = join(
  REPO_ROOT,
  "docs/library/customer-facing/BILLING_AND_PLANS.md",
);

describe("billing help guide drift guard", () => {
  const sourceDoc = readFileSync(BILLING_AND_PLANS_SOURCE_DOC, "utf8");

  it("reads the registered billing help source document", () => {
    expect(sourceDoc).toContain("# Billing and plans");
  });

  it.each(BILLING_HELP_SOURCE_DRIFT_ANCHORS.map((anchor) => [anchor.id, anchor.phrases] as const))(
    "keeps %s aligned with BILLING_AND_PLANS.md",
    (_id, phrases) => {
      for (const phrase of phrases) {
        expect(sourceDoc, `missing phrase "${phrase}"`).toContain(phrase);
      }
    },
  );
});

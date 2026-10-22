import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BILLING_AND_PLANS_HELP_CANONICAL_PATH,
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE,
  BILLING_AND_PLANS_HELP_SOURCES,
} from "@/lib/billing-and-plans-help-evidence-copy";
import {
  BILLING_HELP_GUIDE_HEADINGS,
  BILLING_HELP_NEGATION_DRIFT_MARKERS,
  BILLING_HELP_OVERVIEW,
  BILLING_HELP_SOURCE_DRIFT_ANCHORS,
} from "@/lib/billing-help-guide-content";

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

  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of BILLING_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("keeps overview distinct from claim discipline body", () => {
    expect(BILLING_HELP_OVERVIEW).not.toBe(BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE);
  });

  it("lists guide headings including claim discipline and where-to-go-next", () => {
    expect(
      BILLING_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-billing-claim-discipline-heading"),
    ).toBe(true);
    expect(BILLING_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "where-to-go-next")).toBe(true);
  });

  it("lists billing help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = BILLING_AND_PLANS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(BILLING_AND_PLANS_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(BILLING_AND_PLANS_HELP_CANONICAL_PATH);
  });
});

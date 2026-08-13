import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY,
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS,
} from "@/lib/accelerator-chooser-help-guide-content";

const BANNED_PRODUCT_VOCAB_PATTERNS = [
  /\bcore pilot\b/i,
  /\bsources package\b/i,
  /\brun and export\b/i,
  /\bstart an architecture review\b/i,
  /\bstart the review\b/i,
  /\bthe run\b/i,
] as const;

describe("accelerator-chooser-help-guide-content", () => {
  it("uses buyer-facing page title", () => {
    expect(ACCELERATOR_CHOOSER_HELP_PAGE_TITLE).toBe("Starter proof packs");
  });

  it("defines workflow steps with signed-review prerequisite first", () => {
    expect(ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS[0]?.title).toBe("Confirm a signed review record");
    expect(ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS.length).toBe(3);
    expect(ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS.every((step) => step.href.length > 0)).toBe(true);
    expect(ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS[2]?.href).toBe("/help/repeat-review-loop");
    expect(ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS[2]?.href).not.toBe(
      ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS[0]?.href,
    );
  });

  it("avoids deprecated product vocabulary in exported copy", () => {
    const corpus = [
      ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
      ...ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS.flatMap((step) => [step.title, step.description, step.ctaLabel]),
      ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY,
    ].join("\n");

    for (const pattern of BANNED_PRODUCT_VOCAB_PATTERNS) {
      expect(corpus).not.toMatch(pattern);
    }

    expect(corpus.toLowerCase()).toContain("signed review record");
    expect(corpus.toLowerCase()).not.toMatch(/\blog\b/);
  });
});

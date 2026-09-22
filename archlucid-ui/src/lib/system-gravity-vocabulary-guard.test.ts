import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD,
  ARCHITECTURE_DRAFT_HANDOFF_CANONICAL_REVIEW_LABEL,
} from "@/lib/architecture/architecture-draft-handoff-gate";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-gravity vocabulary guard (SG-003)", () => {
  it("Working handoff copy does not treat the review as Monday morning", () => {
    expect(ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD.toLowerCase()).not.toContain("canonical work surface");
    expect(ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD.toLowerCase()).toContain("architecture");

    expect(ARCHITECTURE_DRAFT_HANDOFF_CANONICAL_REVIEW_LABEL.toLowerCase()).toContain("job");
    expect(ARCHITECTURE_DRAFT_HANDOFF_CANONICAL_REVIEW_LABEL.toLowerCase()).not.toContain(
      "canonical work surface",
    );
  });

  it("vocabulary doc exists and forbids review-as-Home phrasing", () => {
    const vocabulary = readFileSync(
      join(REPO_ROOT, "docs/architecture/SYSTEM_GRAVITY_VOCABULARY.md"),
      "utf8",
    );

    expect(vocabulary).toMatch(/job inspector/i);
    expect(vocabulary).toMatch(/Monday morning/i);
  });
});

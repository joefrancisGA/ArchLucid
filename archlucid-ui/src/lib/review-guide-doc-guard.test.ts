import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  REVIEW_SCOPE_HELP_EXPLANATION,
  REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION,
} from "@/lib/focused-pilot-mode-policy-packs";

const REVIEW_GUIDE_PATH = "docs/library/customer-facing/REVIEW_GUIDE.md";

function readReviewGuideMarkdown(): string {
  return readFileSync(join(process.cwd(), "..", REVIEW_GUIDE_PATH), "utf8");
}

describe("review-guide-doc-guard (TB-764)", () => {
  it("uses canonical review-scope explanation shared with wizard copy constants", () => {
    const markdown = readReviewGuideMarkdown();

    expect(markdown.replace(/\*\*/g, "")).toContain(REVIEW_SCOPE_HELP_EXPLANATION);
    expect(markdown).toContain(REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION);
    expect(markdown).toContain("saved architecture draft");
    expect(markdown).toContain("[Start a review](/help/evidence-intake)");
    expect(markdown).toContain("[Findings](/help/findings)");
    expect(markdown).toContain("[Review packages](/help/review-packages)");
    expect(markdown).not.toContain("Plain-language vocabulary");
    expect(markdown).not.toMatch(/six.dimensional|assurance.coverage/i);
  });
});

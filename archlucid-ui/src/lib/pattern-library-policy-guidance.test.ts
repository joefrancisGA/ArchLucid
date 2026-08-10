import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { PATTERN_LIBRARY_POLICY_PACKS_HUB_PATH } from "@/lib/pattern-library-policy-guidance-copy";

const DETAIL_CLIENT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "insights",
  "patterns",
  "_sections",
  "PatternLibraryDetailClient.tsx",
);

const PATTERN_CARD = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "insights",
  "patterns",
  "_sections",
  "PatternLibraryPatternCard.tsx",
);

const POLICY_GUIDANCE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "insights",
  "patterns",
  "_sections",
  "PatternLibraryPolicyGuidance.tsx",
);

describe("pattern-library-policy-guidance (TB-1813)", () => {
  it("links policy pack guidance only to the stable governance hub", () => {
    const detailSource = readFileSync(DETAIL_CLIENT, "utf8");
    const cardSource = readFileSync(PATTERN_CARD, "utf8");
    const guidanceSource = readFileSync(POLICY_GUIDANCE, "utf8");

    expect(guidanceSource).toContain("PATTERN_LIBRARY_POLICY_PACKS_HUB_PATH");
    expect(detailSource).toContain("PatternLibraryRelatedPolicyPacks");
    expect(cardSource).toContain("PatternLibraryRelatedPolicyPacks");
    expect(detailSource).not.toMatch(/href=.*relatedPolicyRules/i);
    expect(detailSource).toContain("PatternLibraryRelatedPolicyRules");
  });
});

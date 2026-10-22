import { describe, expect, it } from "vitest";

import { FAQ_CANONICAL_PATH, FAQ_CLAIM_DISCIPLINE, FAQ_SOURCES } from "@/lib/faq-evidence-copy";

describe("faq-evidence-copy", () => {
  it("does not self-link /faq in Sources", () => {
    expect(FAQ_SOURCES.some((link) => link.href === FAQ_CANONICAL_PATH)).toBe(false);
  });

  it("states orientation-only scope in claim discipline", () => {
    expect(FAQ_CLAIM_DISCIPLINE).toContain("orientation only");
    expect(FAQ_CLAIM_DISCIPLINE).toContain("procurement");
  });
});

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE,
  ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_INTELLIGENCE_PAGE_TITLE,
  architectureIntelligencePageSubtitle,
} from "@/lib/architecture/architecture-intelligence-page-copy";

describe("architecture-intelligence-page-copy", () => {
  it("uses product-safe architecture intelligence page naming", () => {
    expect(ARCHITECTURE_INTELLIGENCE_PAGE_TITLE).toBe("Architecture intelligence");
    expect(ARCHITECTURE_INTELLIGENCE_PAGE_TITLE).not.toMatch(/\brun\b/i);
  });

  it("uses a shorter buyer subtitle", () => {
    expect(architectureIntelligencePageSubtitle(true)).toBe(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER);
    expect(architectureIntelligencePageSubtitle(false)).toBe(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE);
    expect(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER.length).toBeLessThan(
      ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE.length,
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE,
  ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_INTELLIGENCE_PAGE_TITLE,
  architectureIntelligencePageSubtitle,
} from "@/lib/architecture/architecture-intelligence-page-copy";

describe("architecture-intelligence-page-copy", () => {
  it("uses product-safe architecture intelligence page naming", () => {
    expect(ARCHITECTURE_INTELLIGENCE_PAGE_TITLE).toBe("Try another reasoning pass");
    expect(ARCHITECTURE_INTELLIGENCE_PAGE_TITLE).not.toMatch(/\brun\b/i);
  });

  it("exposes buyer-polished and architect subtitles", () => {
    expect(architectureIntelligencePageSubtitle(true)).toBe(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER);
    expect(architectureIntelligencePageSubtitle(false)).toBe(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE);
    expect(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER).not.toBe(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE);
  });
});

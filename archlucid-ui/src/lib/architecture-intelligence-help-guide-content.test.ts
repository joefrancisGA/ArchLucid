import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE_BUYER,
  architectureIntelligenceHelpPageSubtitle,
} from "@/lib/architecture-intelligence-help-guide-content";

describe("architectureIntelligenceHelpPageSubtitle", () => {
  it("returns buyer and operator subtitles", () => {
    expect(architectureIntelligenceHelpPageSubtitle(true)).toBe(ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE_BUYER);
    expect(architectureIntelligenceHelpPageSubtitle(false)).toBe(ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE);
    expect(ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE_BUYER.length).toBeLessThan(
      ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE.length,
    );
  });
});

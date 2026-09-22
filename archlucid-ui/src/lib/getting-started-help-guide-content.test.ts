import { describe, expect, it } from "vitest";

import {
  GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER,
  GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR,
  gettingStartedHelpPageSubtitle,
  resolveGettingStartedHelpSources,
  SECURENOW_GETTING_STARTED_HELP_SUBTITLE,
} from "@/lib/getting-started-help-guide-content";

describe("gettingStartedHelpPageSubtitle", () => {
  it("selects buyer and operator subtitles", () => {
    expect(gettingStartedHelpPageSubtitle(true)).toBe(GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER);
    expect(gettingStartedHelpPageSubtitle(false)).toBe(GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR);
    expect(GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER.length).toBeLessThan(
      GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR.length,
    );
  });

  it("uses SecureNow subtitles without architecture review CTAs in sources", () => {
    expect(gettingStartedHelpPageSubtitle(false, "security")).toBe(SECURENOW_GETTING_STARTED_HELP_SUBTITLE);
    const sources = resolveGettingStartedHelpSources("security");
    expect(sources.some((link) => link.href.includes("/architecture/reviews"))).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE,
  SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE_BUYER,
  specialtyWalkthroughsHelpPageSubtitle,
} from "@/lib/specialty-walkthroughs-help-guide-content";

describe("specialtyWalkthroughsHelpPageSubtitle", () => {
  it("returns shorter buyer copy in buyer-polished shell", () => {
    expect(specialtyWalkthroughsHelpPageSubtitle(true)).toBe(SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE_BUYER);
    expect(specialtyWalkthroughsHelpPageSubtitle(false)).toBe(SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE);
    expect(SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE_BUYER.length).toBeLessThan(
      SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE.length,
    );
  });
});

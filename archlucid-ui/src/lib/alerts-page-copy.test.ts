import { describe, expect, it } from "vitest";

import {
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF,
  ALERTS_PAGE_SUBTITLE,
  alertsPageSubtitle,
  BUYER_ALERTS_PAGE_SUBTITLE,
} from "@/lib/alerts-page-copy";

describe("alerts-page-copy", () => {
  it("uses shorter buyer inbox subtitle and canonical reviews href", () => {
    expect(alertsPageSubtitle(true)).toBe(BUYER_ALERTS_PAGE_SUBTITLE);
    expect(alertsPageSubtitle(false)).toBe(ALERTS_PAGE_SUBTITLE);
    expect(BUYER_ALERTS_PAGE_SUBTITLE.length).toBeLessThan(ALERTS_PAGE_SUBTITLE.length);
    expect(ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF).toBe("/reviews");
  });
});

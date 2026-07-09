import { describe, expect, it } from "vitest";

import {
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PRIMARY_START_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
} from "./reviews-hub-copy";

describe("reviews-hub-copy", () => {
  it("uses review-oriented hub language", () => {
    expect(REVIEWS_HUB_PAGE_SUBTITLE).toMatch(/^Start, resume, and inspect/);
    expect(REVIEWS_HUB_PRIMARY_START_LABEL).toBe("Start architecture review");
    expect(REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL).toBe("Start architecture review");
    expect(REVIEWS_HUB_RECENT_EMPTY_BODY).toContain("Start an architecture review");
    expect(REVIEWS_HUB_RECENT_EMPTY_BODY).not.toContain("Create architecture");
  });
});

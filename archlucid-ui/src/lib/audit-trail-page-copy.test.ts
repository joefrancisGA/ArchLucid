import { describe, expect, it } from "vitest";

import {
  AUDIT_TRAIL_PAGE_SUBTITLE_BUYER,
  AUDIT_TRAIL_PAGE_SUBTITLE_OPERATOR,
  AUDIT_TRAIL_PAGE_TITLE,
  AUDIT_TRAIL_PRODUCT_SAFE_INTRO,
  auditTrailPageSubtitle,
} from "@/lib/audit-trail-page-copy";

describe("audit-trail-page-copy", () => {
  it("uses product-safe audit page naming", () => {
    expect(AUDIT_TRAIL_PAGE_TITLE).toBe("Audit trail");
    expect(AUDIT_TRAIL_PRODUCT_SAFE_INTRO).not.toMatch(/GET \/|proxy override|read-only API/i);
  });

  it("uses shorter buyer subtitle aligned with product-safe intro", () => {
    expect(auditTrailPageSubtitle(true)).toBe(AUDIT_TRAIL_PAGE_SUBTITLE_BUYER);
    expect(auditTrailPageSubtitle(false)).toBe(AUDIT_TRAIL_PAGE_SUBTITLE_OPERATOR);
    expect(AUDIT_TRAIL_PAGE_SUBTITLE_BUYER).toBe(AUDIT_TRAIL_PRODUCT_SAFE_INTRO);
  });
});

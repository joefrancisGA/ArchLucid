import { describe, expect, it } from "vitest";

import {
  AUDIT_TRAIL_HELP_PAGE_SUBTITLE,
  AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER,
  AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR,
  auditTrailHelpPageSubtitle,
} from "@/lib/audit-trail-help-guide-content";

describe("audit-trail-help-guide-content", () => {
  it("uses shorter buyer audit trail help subtitle", () => {
    expect(auditTrailHelpPageSubtitle(true)).toBe(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER);
    expect(auditTrailHelpPageSubtitle(false)).toBe(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR);
    expect(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER.length).toBeLessThan(AUDIT_TRAIL_HELP_PAGE_SUBTITLE.length);
  });
});

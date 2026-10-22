import { describe, expect, it } from "vitest";

import { auditTrailNavHref, isAuditNavPath } from "@/lib/audit-nav-paths";

describe("audit-nav-paths", () => {
  it("builds scoped audit URLs with runId query params (TB-649)", () => {
    expect(auditTrailNavHref("run-abc")).toBe("/governance/audit?runId=run-abc");
    expect(auditTrailNavHref("")).toBe("/governance/audit");
    expect(auditTrailNavHref(null)).toBe("/governance/audit");
  });

  it("recognizes governance and legacy audit nav paths", () => {
    expect(isAuditNavPath("/governance/audit")).toBe(true);
    expect(isAuditNavPath("/audit")).toBe(true);
    expect(isAuditNavPath("/governance")).toBe(false);
  });
});

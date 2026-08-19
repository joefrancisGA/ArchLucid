import { describe, expect, it } from "vitest";

import {
  AUDIT_EVENTS_VIRTUALIZE_MIN_ROWS,
  shouldVirtualizeAuditEventsTable,
} from "@/app/(operator)/governance/audit/_sections/audit-events-virtualization";

describe("audit-events-virtualization (TB-935)", () => {
  it("does not virtualize below the row threshold", () => {
    expect(shouldVirtualizeAuditEventsTable(0)).toBe(false);
    expect(shouldVirtualizeAuditEventsTable(AUDIT_EVENTS_VIRTUALIZE_MIN_ROWS - 1)).toBe(false);
  });

  it("virtualizes at and above the row threshold", () => {
    expect(shouldVirtualizeAuditEventsTable(AUDIT_EVENTS_VIRTUALIZE_MIN_ROWS)).toBe(true);
  });
});

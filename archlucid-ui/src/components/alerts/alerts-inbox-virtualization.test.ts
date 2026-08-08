import { describe, expect, it } from "vitest";

import {
  ALERTS_INBOX_VIRTUALIZE_MIN_ROWS,
  shouldVirtualizeAlertsInboxList,
} from "@/components/alerts/alerts-inbox-virtualization";

describe("alerts-inbox-virtualization (TB-935)", () => {
  it("does not virtualize below the row threshold", () => {
    expect(shouldVirtualizeAlertsInboxList(0)).toBe(false);
    expect(shouldVirtualizeAlertsInboxList(ALERTS_INBOX_VIRTUALIZE_MIN_ROWS - 1)).toBe(false);
  });

  it("virtualizes at and above the row threshold", () => {
    expect(shouldVirtualizeAlertsInboxList(ALERTS_INBOX_VIRTUALIZE_MIN_ROWS)).toBe(true);
  });
});

import { describe, expect, it, beforeEach } from "vitest";

import {
  clearAuditRecentSavedViews,
  readAuditRecentSavedViews,
  recordAuditRecentSavedView,
} from "@/lib/audit-recent-saved-views";

describe("audit-recent-saved-views", () => {
  beforeEach(() => {
    clearAuditRecentSavedViews();
  });

  it("records up to three recent saved views", () => {
    recordAuditRecentSavedView({ viewId: "view-1", name: "Open findings" });
    recordAuditRecentSavedView({ viewId: "view-2", name: "Finalized only" });

    expect(readAuditRecentSavedViews().map((entry) => entry.viewId)).toEqual(["view-2", "view-1"]);
  });
});

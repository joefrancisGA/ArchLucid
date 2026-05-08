import { describe, expect, it } from "vitest";

import {
  auditEventFriendlyTitle,
  auditEventLifecycleStage,
  ReviewAuditLifecycleStage,
} from "@/lib/audit-event-presentation";

describe("auditEventFriendlyTitle", () => {
  it("matches Contracts buyer titles for known audit spine codes", () => {
    expect(auditEventFriendlyTitle("RunStarted")).toBe("Review started");
    expect(auditEventFriendlyTitle("ManifestFinalized")).toBe("Manifest finalized");
    expect(auditEventFriendlyTitle("GovernanceApprovalRequested")).toBe("Governance approval requested");
    expect(auditEventFriendlyTitle("ManifestViewed")).toBe("Manifest viewed");
  });
});

describe("auditEventLifecycleStage", () => {
  it("matches Contracts coarse buckets", () => {
    expect(auditEventLifecycleStage("RunSubmitted")).toBe(ReviewAuditLifecycleStage.ReviewStarted);
    expect(auditEventLifecycleStage("FindingsSnapshotSealed")).toBe(ReviewAuditLifecycleStage.FindingsCaptured);
    expect(auditEventLifecycleStage("GovernanceApprovalRequested")).toBe(ReviewAuditLifecycleStage.GovernanceHandoff);
  });
});

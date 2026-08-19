import { describe, expect, it } from "vitest";

import {
  auditEventFriendlyTitle,
  auditEventLifecycleStage,
  ReviewAuditLifecycleStage,
} from "@/lib/audit-event-presentation";

describe("auditEventFriendlyTitle", () => {
  it("matches Contracts buyer titles for known audit spine codes", () => {
    expect(auditEventFriendlyTitle("RunStarted")).toBe("Review started");
    expect(auditEventFriendlyTitle("ManifestFinalized")).toBe("Review finalized");
    expect(auditEventFriendlyTitle("GovernanceApprovalRequested")).toBe("Governance approval requested");
    expect(auditEventFriendlyTitle("Workspace.ModelExecutionProfileUpdated")).toBe(
      "Workspace model execution profile updated",
    );
    expect(auditEventFriendlyTitle("Run.ModelExecutionProfileOverrideApplied")).toBe(
      "Review model execution profile override applied",
    );
    expect(auditEventFriendlyTitle("ManifestViewed")).toBe("Review viewed");
  });
});

describe("auditEventLifecycleStage", () => {
  it("matches Contracts coarse buckets", () => {
    expect(auditEventLifecycleStage("RunSubmitted")).toBe(ReviewAuditLifecycleStage.ReviewStarted);
    expect(auditEventLifecycleStage("FindingsSnapshotSealed")).toBe(ReviewAuditLifecycleStage.FindingsCaptured);
    expect(auditEventLifecycleStage("GovernanceApprovalRequested")).toBe(ReviewAuditLifecycleStage.GovernanceHandoff);
  });
});

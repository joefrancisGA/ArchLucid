import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  consumeIdleDeskRestoreFormSnapshot,
  persistIdleDeskRestoreBeforeSessionClear,
  readIdleDeskRestorePayload,
} from "@/lib/auth/idle-desk-restore";
import {
  buildLivelihoodIdleFormSnapshotKey,
  clearLivelihoodIdleFormSnapshotRegistryForTests,
  registerLivelihoodIdleFormSnapshot,
} from "@/lib/auth/livelihood-idle-form-snapshot";
import {
  clearOperatorScopeStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";

const SAMPLE_SCOPE = {
  tenantId: "tenant-a",
  workspaceId: "workspace-b",
  projectId: "project-c",
  workspaceLabel: "Payments",
  projectLabel: "Primary",
};

describe("governance-approval-rationale idle snapshot (LW-073)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    writeOperatorScopeToStorage(SAMPLE_SCOPE);
  });

  afterEach(() => {
    clearLivelihoodIdleFormSnapshotRegistryForTests();
    clearOperatorScopeStorage();
  });

  it("persists and restores the approval comment when the session idles out", () => {
    const returnPath = "/governance/workflow";
    const approvalRequestId = "approval-req-1";
    const snapshotKey = buildLivelihoodIdleFormSnapshotKey(
      "governance-approval-rationale",
      approvalRequestId,
    );

    registerLivelihoodIdleFormSnapshot(snapshotKey, {
      surfaceId: "governance-approval-rationale",
      returnPath,
      entityKey: approvalRequestId,
      fields: {
        reviewComment: "Approved with compensating controls documented.",
        reviewedBy: "principal.architect@example.com",
      },
      savedAtUtc: "2026-09-10T12:00:00.000Z",
    });

    persistIdleDeskRestoreBeforeSessionClear(returnPath);

    expect(
      readIdleDeskRestorePayload()?.formSnapshots?.[snapshotKey]?.fields.reviewComment,
    ).toBe("Approved with compensating controls documented.");

    const restored = consumeIdleDeskRestoreFormSnapshot(snapshotKey, returnPath);

    expect(restored?.fields.reviewComment).toBe("Approved with compensating controls documented.");
    expect(restored?.fields.reviewedBy).toBe("principal.architect@example.com");
  });
});

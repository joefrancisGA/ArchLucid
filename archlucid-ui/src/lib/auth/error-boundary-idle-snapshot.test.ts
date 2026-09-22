import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  flushLivelihoodIdleFormSnapshotBeforeUnmount,
  persistLivelihoodIdleSnapshotsBeforeErrorRecovery,
} from "@/lib/auth/error-boundary-idle-snapshot";
import {
  clearIdleDeskRestorePayload,
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

describe("error-boundary-idle-snapshot (LW-095)", () => {
  beforeEach(() => {
    localStorage.clear();
    writeOperatorScopeToStorage(SAMPLE_SCOPE);
    window.history.pushState({}, "", "/governance/workflow?tab=approvals");
  });

  afterEach(() => {
    clearLivelihoodIdleFormSnapshotRegistryForTests();
    clearOperatorScopeStorage();
    clearIdleDeskRestorePayload();
  });

  it("persists registered snapshots before error recovery without throwing", () => {
    const returnPath = "/governance/workflow?tab=approvals";
    const snapshotKey = buildLivelihoodIdleFormSnapshotKey("governance-approval-rationale", "approval-1");

    registerLivelihoodIdleFormSnapshot(snapshotKey, {
      surfaceId: "governance-approval-rationale",
      returnPath,
      entityKey: "approval-1",
      fields: { reviewComment: "Needs follow-up on data residency." },
      savedAtUtc: "2026-09-11T00:00:00.000Z",
    });

    expect(persistLivelihoodIdleSnapshotsBeforeErrorRecovery()).toBe(true);
    expect(
      readIdleDeskRestorePayload()?.formSnapshots?.[snapshotKey]?.fields.reviewComment,
    ).toBe("Needs follow-up on data residency.");
  });

  it("flushLivelihoodIdleFormSnapshotBeforeUnmount merges before registry clear", () => {
    const returnPath = "/governance/workflow";
    const snapshotKey = buildLivelihoodIdleFormSnapshotKey("governance-approval-rationale", "approval-2");

    flushLivelihoodIdleFormSnapshotBeforeUnmount(snapshotKey, {
      surfaceId: "governance-approval-rationale",
      returnPath,
      entityKey: "approval-2",
      fields: { reviewComment: "Approved with conditions." },
      savedAtUtc: "2026-09-11T00:00:00.000Z",
    });

    registerLivelihoodIdleFormSnapshot(snapshotKey, null);

    expect(
      readIdleDeskRestorePayload()?.formSnapshots?.[snapshotKey]?.fields.reviewComment,
    ).toBe("Approved with conditions.");
  });

  it("never throws when localStorage is unavailable", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(persistLivelihoodIdleSnapshotsBeforeErrorRecovery()).toBe(false);
    expect(() => {
      flushLivelihoodIdleFormSnapshotBeforeUnmount("key", {
        surfaceId: "surface",
        returnPath: "/governance/workflow",
        entityKey: "entity",
        fields: { reviewComment: "hidden" },
        savedAtUtc: "2026-09-11T00:00:00.000Z",
      });
    }).not.toThrow();

    setItem.mockRestore();
  });
});

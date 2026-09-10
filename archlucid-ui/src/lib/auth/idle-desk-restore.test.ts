import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearIdleDeskRestorePayload,
  consumeIdleDeskRestoreFormSnapshot,
  IDLE_DESK_RESTORE_STORAGE_KEY,
  persistIdleDeskRestoreBeforeSessionClear,
  readIdleDeskRestorePayload,
  restoreIdleDeskScopeAfterSignIn,
} from "@/lib/auth/idle-desk-restore";
import {
  buildLivelihoodIdleFormSnapshotKey,
  clearLivelihoodIdleFormSnapshotRegistryForTests,
  registerLivelihoodIdleFormSnapshot,
} from "@/lib/auth/livelihood-idle-form-snapshot";
import { OIDC_POST_SIGN_IN_RETURN_URL_KEY } from "@/lib/oidc/storage-keys";
import {
  clearOperatorScopeStorage,
  readOperatorScopeFromStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";

const SAMPLE_SCOPE = {
  tenantId: "tenant-a",
  workspaceId: "workspace-b",
  projectId: "project-c",
  workspaceLabel: "Payments",
  projectLabel: "Primary",
};

describe("idle-desk-restore (DR-12)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    writeOperatorScopeToStorage(SAMPLE_SCOPE);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearOperatorScopeStorage();
    clearIdleDeskRestorePayload();
    clearLivelihoodIdleFormSnapshotRegistryForTests();
  });

  it("persists scope and return path before session clear", () => {
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-1?reviewTab=findings");

    expect(readIdleDeskRestorePayload()?.scope.projectId).toBe("project-c");
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe(
      "/architecture/reviews/run-1?reviewTab=findings",
    );
  });

  it("does not store access tokens in sessionStorage", () => {
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-1");

    expect(sessionStorage.getItem("archlucid_oidc_access_token")).toBeNull();
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-1");
  });

  it("restores operator scope after sign-in and clears the restore payload", () => {
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-1");
    clearOperatorScopeStorage();

    expect(readOperatorScopeFromStorage()).toBeNull();

    expect(restoreIdleDeskScopeAfterSignIn()).toBe(true);
    expect(readOperatorScopeFromStorage()?.projectId).toBe("project-c");
    expect(localStorage.getItem(IDLE_DESK_RESTORE_STORAGE_KEY)).toBeNull();
  });

  it("drops unsafe return paths", () => {
    persistIdleDeskRestoreBeforeSessionClear("https://evil.example/phish");

    expect(readIdleDeskRestorePayload()).toBeNull();
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
  });

  it("persists dirty livelihood form snapshots before session clear (WS-18)", () => {
    const returnPath = "/architecture/reviews/run-1/findings/finding-1";
    const snapshotKey = buildLivelihoodIdleFormSnapshotKey("finding-inspect-disposition", "run-1:finding-1");

    registerLivelihoodIdleFormSnapshot(snapshotKey, {
      surfaceId: "finding-inspect-disposition",
      returnPath,
      entityKey: "run-1:finding-1",
      fields: { rationale: "Defer until Q4 capacity is available." },
      savedAtUtc: "2026-09-08T12:00:00.000Z",
    });

    persistIdleDeskRestoreBeforeSessionClear(returnPath);

    expect(readIdleDeskRestorePayload()?.formSnapshots?.[snapshotKey]?.fields.rationale).toBe(
      "Defer until Q4 capacity is available.",
    );
    expect(JSON.stringify(readIdleDeskRestorePayload())).not.toContain("access_token");
  });

  it("round-trips disposition rationale after scope restore when return path matches (WS-18)", () => {
    const returnPath = "/architecture/reviews/run-1/findings/finding-1";
    const snapshotKey = buildLivelihoodIdleFormSnapshotKey("finding-inspect-disposition", "run-1:finding-1");

    localStorage.setItem(
      IDLE_DESK_RESTORE_STORAGE_KEY,
      JSON.stringify({
        returnPath,
        scope: SAMPLE_SCOPE,
        savedAtUtc: "2026-09-08T12:00:00.000Z",
        formSnapshots: {
          [snapshotKey]: {
            surfaceId: "finding-inspect-disposition",
            returnPath,
            entityKey: "run-1:finding-1",
            fields: { rationale: "Accepted with compensating controls documented." },
            savedAtUtc: "2026-09-08T12:00:00.000Z",
          },
        },
      }),
    );

    expect(restoreIdleDeskScopeAfterSignIn()).toBe(true);

    const restored = consumeIdleDeskRestoreFormSnapshot(snapshotKey, returnPath);

    expect(restored?.fields.rationale).toBe("Accepted with compensating controls documented.");
    expect(readIdleDeskRestorePayload()).toBeNull();
  });
});

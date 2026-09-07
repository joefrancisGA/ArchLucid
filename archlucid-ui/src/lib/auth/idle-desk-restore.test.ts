import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearIdleDeskRestorePayload,
  IDLE_DESK_RESTORE_STORAGE_KEY,
  persistIdleDeskRestoreBeforeSessionClear,
  readIdleDeskRestorePayload,
  restoreIdleDeskScopeAfterSignIn,
} from "@/lib/auth/idle-desk-restore";
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
});

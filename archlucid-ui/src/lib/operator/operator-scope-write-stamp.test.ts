import { afterEach, describe, expect, it } from "vitest";

import {
  captureOperatorScopeWriteStamp,
  OPERATOR_SCOPE_WRITE_MISMATCH_MESSAGE,
  readOperatorScopeWriteMismatchMessage,
} from "./operator-scope-write-stamp";
import { writeOperatorScopeToStorage } from "./operator-scope-storage";

describe("operator-scope-write-stamp (LW-087)", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("detects when the active scope no longer matches the mount stamp", () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "A",
      projectLabel: "Primary",
    });
    const stamp = captureOperatorScopeWriteStamp();

    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-b",
      workspaceLabel: "B",
      projectLabel: "Secondary",
    });

    expect(readOperatorScopeWriteMismatchMessage(stamp)).toBe(OPERATOR_SCOPE_WRITE_MISMATCH_MESSAGE);
  });
});

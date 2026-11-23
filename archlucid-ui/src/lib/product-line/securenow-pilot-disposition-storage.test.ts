import { beforeEach, describe, expect, it } from "vitest";

import { OPERATOR_SCOPE_STORAGE_KEY } from "@/lib/operator/operator-scope-storage";
import {
  readSecureNowPilotDisposition,
  writeSecureNowPilotDisposition,
} from "./securenow-pilot-disposition-storage";

function storeScope(tenantId: string, workspaceId: string): void {
  window.localStorage.setItem(
    OPERATOR_SCOPE_STORAGE_KEY,
    JSON.stringify({
      tenantId,
      workspaceId,
      projectId: "project-1",
      workspaceLabel: workspaceId,
      projectLabel: "project-1",
    }),
  );
}

describe("securenow pilot disposition storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not return another workspace cache for the same path id", () => {
    storeScope("tenant-1", "workspace-a");
    writeSecureNowPilotDisposition("fixture-path-01", {
      outcome: "Extend",
      rationale: "Workspace A follow-up.",
    });

    storeScope("tenant-1", "workspace-b");

    expect(readSecureNowPilotDisposition("fixture-path-01")).toBeNull();
  });
});
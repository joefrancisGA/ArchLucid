import { describe, expect, it } from "vitest";

import {
  resolveWorkspaceScopeLabelFromRecord,
  readActiveWorkspaceScopeLabel,
} from "@/lib/active-workspace-scope-label";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";

function record(overrides: Partial<OperatorScopeRecord> = {}): OperatorScopeRecord {
  return {
    tenantId: DEV_SCOPE_TENANT_ID,
    workspaceId: DEV_SCOPE_WORKSPACE_ID,
    projectId: DEV_SCOPE_PROJECT_ID,
    workspaceLabel: "",
    projectLabel: "",
    ...overrides,
  };
}

describe("resolveWorkspaceScopeLabelFromRecord", () => {
  it("prefers the sample-workspace compact label for the dev-default scope even when storage has a label", () => {
    expect(resolveWorkspaceScopeLabelFromRecord(record({ workspaceLabel: "Claims Intake" }))).toBe(
      "Claims Intake Demo",
    );
  });

  it("drops a trailing 'workspace' suffix for non-sample workspaces", () => {
    expect(
      resolveWorkspaceScopeLabelFromRecord(
        record({
          workspaceId: "abcdef01-2345-6789-abcd-ef0123456789",
          workspaceLabel: "Claims Intake Workspace",
        }),
      ),
    ).toBe("Claims Intake");
  });

  it("falls back to the sample-workspace compact label for the dev-default scope", () => {
    expect(resolveWorkspaceScopeLabelFromRecord(record())).toBe("Claims Intake Demo");
  });

  it("treats a whitespace-only stored label as missing", () => {
    expect(resolveWorkspaceScopeLabelFromRecord(record({ workspaceLabel: "   " }))).toBe(
      "Claims Intake Demo",
    );
  });

  it("shortens an unknown workspace id rather than leaking the raw uuid", () => {
    const label: string = resolveWorkspaceScopeLabelFromRecord(
      record({ workspaceId: "abcdef01-2345-6789-abcd-ef0123456789" }),
    );

    expect(label).toBe("abcdef01…");
  });

  it("resolves a label with no record present", () => {
    expect(resolveWorkspaceScopeLabelFromRecord(null)).toBe("Claims Intake Demo");
  });
});

describe("readActiveWorkspaceScopeLabel", () => {
  it("returns a non-empty label without stored scope", () => {
    expect(readActiveWorkspaceScopeLabel().length).toBeGreaterThan(0);
  });
});

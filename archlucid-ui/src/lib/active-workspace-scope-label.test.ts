import { describe, expect, it } from "vitest";

import {
  resolveWorkspaceScopeLabelFromRecord,
  readActiveWorkspaceScopeLabel,
} from "@/lib/active-workspace-scope-label";
import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
  BUYER_WORKSPACE_DISPLAY_NAME,
  BUYER_WORKSPACE_SHORT_NAME,
} from "@/lib/buyer/buyer-polish-copy";
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
    expect(resolveWorkspaceScopeLabelFromRecord(record({ workspaceLabel: BUYER_WORKSPACE_SHORT_NAME }))).toBe(
      BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
    );
  });

  it("drops a trailing 'workspace' suffix for non-sample workspaces", () => {
    expect(
      resolveWorkspaceScopeLabelFromRecord(
        record({
          workspaceId: "abcdef01-2345-6789-abcd-ef0123456789",
          workspaceLabel: BUYER_WORKSPACE_DISPLAY_NAME,
        }),
      ),
    ).toBe(BUYER_WORKSPACE_SHORT_NAME);
  });

  it("falls back to the sample-workspace compact label for the dev-default scope", () => {
    expect(resolveWorkspaceScopeLabelFromRecord(record())).toBe(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
  });

  it("treats a whitespace-only stored label as missing", () => {
    expect(resolveWorkspaceScopeLabelFromRecord(record({ workspaceLabel: "   " }))).toBe(
      BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
    );
  });

  it("shortens an unknown workspace id rather than leaking the raw uuid", () => {
    const label: string = resolveWorkspaceScopeLabelFromRecord(
      record({ workspaceId: "abcdef01-2345-6789-abcd-ef0123456789" }),
    );

    expect(label).toBe("abcdef01…");
  });

  it("resolves a label with no record present", () => {
    expect(resolveWorkspaceScopeLabelFromRecord(null)).toBe(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
  });
});

describe("readActiveWorkspaceScopeLabel", () => {
  it("returns a non-empty label without stored scope", () => {
    expect(readActiveWorkspaceScopeLabel().length).toBeGreaterThan(0);
  });
});

import { beforeEach, describe, expect, it } from "vitest";

import { applyDedicatedWorkspaceScopeFromAccessToken } from "@/lib/auth/post-auth-dedicated-scope";
import { BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY } from "@/lib/operator/operator-sample-workspace-visit";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";

const dedicatedScope = {
  tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  workspaceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  projectId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
};

function buildAccessToken(): string {
  const payload = Buffer.from(JSON.stringify({
    tenant_id: dedicatedScope.tenantId,
    workspace_id: dedicatedScope.workspaceId,
    project_id: dedicatedScope.projectId,
  }), "utf8").toString("base64url");

  return `header.${payload}.sig`;
}

describe("applyDedicatedWorkspaceScopeFromAccessToken (LS-005)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem(OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY, "1");
  });

  it("writes dedicated scope and clears sample visit on invite accept", () => {
    const applied = applyDedicatedWorkspaceScopeFromAccessToken(buildAccessToken());

    expect(applied).toBe(true);
    expect(readOperatorScopeFromStorage()?.workspaceId).toBe(dedicatedScope.workspaceId);
    expect(readOperatorScopeFromStorage()?.workspaceLabel).not.toBe(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
    expect(sessionStorage.getItem(OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY)).toBeNull();
    expect(readOperatorScopeFromStorage()?.workspaceId).not.toBe(DEV_SCOPE_WORKSPACE_ID);
  });
});

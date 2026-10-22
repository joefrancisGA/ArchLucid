import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyDedicatedWorkspaceScope,
  bootstrapDedicatedWorkspaceScope,
  returnToDedicatedWorkspaceFromSample,
} from "@/lib/operator/operator-scope-bootstrap";
import { OPERATOR_DEDICATED_WORKSPACE_STORAGE_KEY } from "@/lib/operator/operator-dedicated-workspace-storage";
import { OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY } from "@/lib/operator/operator-sample-workspace-visit";
import {
  OPERATOR_SCOPE_STORAGE_KEY,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { writeLastRegistrationPayloadForTests } from "@/lib/operator/operator-registration-scope-test-helpers";
import { clearOidcSession, persistTokenResponse } from "@/lib/oidc/session";

const fetchPostAuthBootstrapStatus = vi.hoisted(() => vi.fn());
const fetchTenantWorkspacesList = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/post-auth-bootstrap-api", () => ({
  fetchPostAuthBootstrapStatus,
}));

vi.mock("@/lib/tenant-workspaces-list-client", () => ({
  fetchTenantWorkspacesList,
}));

const dedicatedScope = {
  tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  workspaceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  projectId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  workspaceLabel: "Acme",
  projectLabel: "Primary project",
};

describe("operator-scope-bootstrap", () => {
  beforeEach(() => {
    clearOidcSession();
    localStorage.clear();
    sessionStorage.clear();
    fetchPostAuthBootstrapStatus.mockReset();
    fetchTenantWorkspacesList.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearOidcSession();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("bootstrapDedicatedWorkspaceScope_replaces_dev_default_scope_for_signed_in_users", async () => {
    persistTokenResponse({
      access_token: "signed-in-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
    writeLastRegistrationPayloadForTests({
      tenantId: dedicatedScope.tenantId,
      defaultWorkspaceId: dedicatedScope.workspaceId,
      defaultProjectId: dedicatedScope.projectId,
      organizationName: dedicatedScope.workspaceLabel,
    });

    localStorage.setItem(
      OPERATOR_SCOPE_STORAGE_KEY,
      JSON.stringify({
        tenantId: DEV_SCOPE_TENANT_ID,
        workspaceId: DEV_SCOPE_WORKSPACE_ID,
        projectId: DEV_SCOPE_PROJECT_ID,
        workspaceLabel: "Customer Intake Demo",
        projectLabel: "Primary project",
      }),
    );

    const applied = await bootstrapDedicatedWorkspaceScope();

    expect(applied).toBe(true);
    expect(readOperatorScopeFromStorage()).toMatchObject(dedicatedScope);
    expect(JSON.parse(localStorage.getItem(OPERATOR_DEDICATED_WORKSPACE_STORAGE_KEY) ?? "{}")).toMatchObject(
      dedicatedScope,
    );
  });

  it("returnToDedicatedWorkspaceFromSample_restores_dedicated_scope", () => {
    applyDedicatedWorkspaceScope(dedicatedScope);
    sessionStorage.setItem(OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY, "1");
    localStorage.setItem(
      OPERATOR_SCOPE_STORAGE_KEY,
      JSON.stringify({
        tenantId: DEV_SCOPE_TENANT_ID,
        workspaceId: DEV_SCOPE_WORKSPACE_ID,
        projectId: DEV_SCOPE_PROJECT_ID,
        workspaceLabel: "Customer Intake Demo",
        projectLabel: "Primary project",
      }),
    );

    const returned = returnToDedicatedWorkspaceFromSample();

    expect(returned).toBe(true);
    expect(readOperatorScopeFromStorage()).toMatchObject(dedicatedScope);
    expect(sessionStorage.getItem(OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY)).toBeNull();
  });
});

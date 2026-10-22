import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchPostAuthBootstrapStatus = vi.hoisted(() => vi.fn());
const fetchTenantWorkspacesList = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/post-auth-bootstrap-api", () => ({
  fetchPostAuthBootstrapStatus,
}));

vi.mock("@/lib/tenant-workspaces-list-client", () => ({
  fetchTenantWorkspacesList,
}));

import { BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { applyDedicatedWorkspaceScopeFromAccessToken } from "@/lib/auth/post-auth-dedicated-scope";
import { resolveEmptyHomeDoThisNext } from "@/lib/resolve-empty-home-do-this-next";
import { visitSampleWorkspaceScope } from "@/lib/operator/operator-scope-actions";
import { bootstrapDedicatedWorkspaceScope } from "@/lib/operator/operator-scope-bootstrap";
import {
  getEffectiveBrowserProxyScopeHeaders,
  OPERATOR_SCOPE_STORAGE_KEY,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { writeLastRegistrationPayloadForTests } from "@/lib/operator/operator-registration-scope-test-helpers";
import { clearOidcSession, persistTokenResponse } from "@/lib/oidc/session";
import { decodeJwtPayload } from "@/lib/oidc/jwt-payload";

const dedicatedScope = {
  tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  workspaceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  projectId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  workspaceLabel: "Acme Corp",
  projectLabel: "Primary project",
};

function buildAccessTokenWithScope(): string {
  const payloadJson = JSON.stringify({
    tenant_id: dedicatedScope.tenantId,
    workspace_id: dedicatedScope.workspaceId,
    project_id: dedicatedScope.projectId,
  });
  const payload = Buffer.from(payloadJson, "utf8").toString("base64url");

  return `header.${payload}.sig`;
}

describe("live-seat first-login matrix (LS-018)", () => {
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

  it("invite_accept_live_purpose_applies_dedicated_scope_not_customer_intake_demo", () => {
    const token = buildAccessTokenWithScope();
    const applied = applyDedicatedWorkspaceScopeFromAccessToken(token);

    expect(applied).toBe(true);
    expect(readOperatorScopeFromStorage()?.workspaceLabel).not.toBe(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
    expect(readOperatorScopeFromStorage()?.workspaceId).toBe(dedicatedScope.workspaceId);

    const jwt = decodeJwtPayload(token);
    expect(jwt?.tenant_id).toBe(dedicatedScope.tenantId);
  });

  it("invite_accept_training_purpose_allows_explicit_sample_visit", () => {
    persistTokenResponse({
      access_token: "signed-in",
      token_type: "Bearer",
      expires_in: 3600,
    });
    const sample = visitSampleWorkspaceScope();

    expect(sample.workspaceLabel).toBe(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
    expect(readOperatorScopeFromStorage()?.workspaceId).toBe(DEV_SCOPE_WORKSPACE_ID);
  });

  it("create_workspace_live_purpose_empty_home_work_primary", () => {
    const action = resolveEmptyHomeDoThisNext({
      setupContext: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
      workingMode: true,
      liveDedicatedEmpty: true,
    });

    expect(action.kind).toBe("work");
    expect(action.label).toBe("New review");
  });

  it("returning_explicit_live_restores_dedicated_from_persisted_demo_storage", async () => {
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
        workspaceLabel: BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
        projectLabel: "Primary project",
      }),
    );

    const applied = await bootstrapDedicatedWorkspaceScope();

    expect(applied).toBe(true);
    const headers = getEffectiveBrowserProxyScopeHeaders();
    expect(headers["x-workspace-id"]).toBe(dedicatedScope.workspaceId);
    expect(headers["x-workspace-id"]).not.toBe(DEV_SCOPE_WORKSPACE_ID);
  });

  it("select_workspace_two_memberships_uses_registration_payload_candidate", async () => {
    persistTokenResponse({
      access_token: "signed-in-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
    writeLastRegistrationPayloadForTests({
      tenantId: dedicatedScope.tenantId,
      defaultWorkspaceId: dedicatedScope.workspaceId,
      defaultProjectId: dedicatedScope.projectId,
      organizationName: "Selected workspace",
    });

    const applied = await bootstrapDedicatedWorkspaceScope();

    expect(applied).toBe(true);
    expect(readOperatorScopeFromStorage()?.workspaceLabel).toBe("Selected workspace");
  });
});

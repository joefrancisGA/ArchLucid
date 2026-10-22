import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildCustomerIntakeDemoScopeRecord,
  isSampleWorkspaceScope,
  resolveDedicatedWorkspaceCandidate,
} from "@/lib/operator/operator-workspace-scope-model";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { writeLastRegistrationPayloadForTests } from "@/lib/operator/operator-registration-scope-test-helpers";
import { clearOidcSession } from "@/lib/oidc/session";

describe("operator-workspace-scope-model", () => {
  beforeEach(() => {
    clearOidcSession();
    localStorage.clear();
  });

  afterEach(() => {
    clearOidcSession();
    localStorage.clear();
  });

  it("isSampleWorkspaceScope_detects_dev_default_scope", () => {
    expect(
      isSampleWorkspaceScope({
        tenantId: DEV_SCOPE_TENANT_ID,
        workspaceId: DEV_SCOPE_WORKSPACE_ID,
        projectId: DEV_SCOPE_PROJECT_ID,
        workspaceLabel: "",
        projectLabel: "",
      }),
    ).toBe(true);
  });

  it("resolveDedicatedWorkspaceCandidate_reads_registration_session", () => {
    writeLastRegistrationPayloadForTests({
      tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      defaultWorkspaceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      defaultProjectId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      organizationName: "Acme",
    });

    expect(resolveDedicatedWorkspaceCandidate()).toMatchObject({
      tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    });
  });

  it("buildCustomerIntakeDemoScopeRecord_uses_dev_default_ids", () => {
    expect(buildCustomerIntakeDemoScopeRecord()).toMatchObject({
      tenantId: DEV_SCOPE_TENANT_ID,
      workspaceId: DEV_SCOPE_WORKSPACE_ID,
      projectId: DEV_SCOPE_PROJECT_ID,
    });
  });
});

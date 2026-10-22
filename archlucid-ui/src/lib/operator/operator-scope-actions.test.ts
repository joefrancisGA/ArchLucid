import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OPERATOR_DEDICATED_WORKSPACE_STORAGE_KEY } from "@/lib/operator/operator-dedicated-workspace-storage";
import { OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY } from "@/lib/operator/operator-sample-workspace-visit";
import { visitSampleWorkspaceScope } from "@/lib/operator/operator-scope-actions";
import {
  OPERATOR_SCOPE_STORAGE_KEY,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { writeLastRegistrationPayloadForTests } from "@/lib/operator/operator-registration-scope-test-helpers";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { clearOidcSession } from "@/lib/oidc/session";

describe("operator-scope-actions", () => {
  beforeEach(() => {
    clearOidcSession();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    clearOidcSession();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("visitSampleWorkspaceScope_marks_visit_and_switches_to_demo_scope", () => {
    const dedicatedTenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const dedicatedWorkspace = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const dedicatedProject = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

    writeLastRegistrationPayloadForTests({
      tenantId: dedicatedTenant,
      defaultWorkspaceId: dedicatedWorkspace,
      defaultProjectId: dedicatedProject,
      organizationName: "Acme",
    });

    visitSampleWorkspaceScope();

    expect(sessionStorage.getItem(OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY)).toBe("1");
    expect(JSON.parse(localStorage.getItem(OPERATOR_DEDICATED_WORKSPACE_STORAGE_KEY) ?? "{}")).toMatchObject({
      tenantId: dedicatedTenant,
      workspaceId: dedicatedWorkspace,
      projectId: dedicatedProject,
    });

    const active = readOperatorScopeFromStorage();

    expect(active).toMatchObject({
      tenantId: DEV_SCOPE_TENANT_ID,
      workspaceId: DEV_SCOPE_WORKSPACE_ID,
      projectId: DEV_SCOPE_PROJECT_ID,
    });
    expect(localStorage.getItem(OPERATOR_SCOPE_STORAGE_KEY)).toContain(DEV_SCOPE_WORKSPACE_ID);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { getEffectiveBrowserProxyScopeHeaders, writeOperatorScopeToStorage, ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";
import { OPERATOR_SCOPE_COOKIE_NAME } from "@/lib/operator/operator-scope-cookie";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";

describe("operator-scope-storage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it("getEffectiveBrowserProxyScopeHeaders_usesLocalStorageWhenAllIdsSet", () => {
    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });
    const h = getEffectiveBrowserProxyScopeHeaders();
    expect(h["x-tenant-id"]).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(h["x-workspace-id"]).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(h["x-project-id"]).toBe("cccccccc-cccc-cccc-cccc-cccccccccccc");
    expect(document.cookie).toContain(`${OPERATOR_SCOPE_COOKIE_NAME}=`);
  });

  it("getEffectiveBrowserProxyScopeHeaders_fallsBackToDevDefaultsWhenNoOverride", () => {
    const h = getEffectiveBrowserProxyScopeHeaders();
    expect(h["x-tenant-id"]).toBe(DEV_SCOPE_TENANT_ID);
    expect(h["x-workspace-id"]).toBe(DEV_SCOPE_WORKSPACE_ID);
    expect(h["x-project-id"]).toBe(DEV_SCOPE_PROJECT_ID);
  });

  it("writeOperatorScopeToStorage_dispatchesScopeChangedEvent", () => {
    const listener = vi.fn();
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, listener);

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, listener);
  });
});

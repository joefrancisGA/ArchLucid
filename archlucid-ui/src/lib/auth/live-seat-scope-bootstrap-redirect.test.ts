import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bootstrapDedicatedWorkspaceScope = vi.hoisted(() => vi.fn(async () => false));

vi.mock("@/lib/operator/operator-scope-bootstrap", () => ({
  bootstrapDedicatedWorkspaceScope,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
}));

vi.mock("@/lib/operator/operator-sample-workspace-visit", () => ({
  isSampleWorkspaceVisitActive: () => false,
}));

const readOperatorScopeFromStorage = vi.hoisted(() =>
  vi.fn(() => ({
    tenantId: "11111111-1111-1111-1111-111111111111",
    workspaceId: "22222222-2222-2222-2222-222222222222",
    projectId: "33333333-3333-3333-3333-333333333333",
    workspaceLabel: "Customer Intake Demo",
    projectLabel: "Primary project",
  })),
);

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: (...args: unknown[]) => readOperatorScopeFromStorage(...args),
}));

import { runSignedInDedicatedScopeBootstrap } from "@/lib/auth/live-seat-scope-bootstrap-redirect";
import { DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";

describe("runSignedInDedicatedScopeBootstrap (LS-010)", () => {
  beforeEach(() => {
    bootstrapDedicatedWorkspaceScope.mockClear();
    bootstrapDedicatedWorkspaceScope.mockResolvedValue(false);
    readOperatorScopeFromStorage.mockClear();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("redirects to auth bootstrap when sticky demo scope cannot be replaced", async () => {
    const replace = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, pathname: "/", replace },
    });

    await runSignedInDedicatedScopeBootstrap();

    expect(bootstrapDedicatedWorkspaceScope).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/auth/bootstrap");
    expect(readOperatorScopeFromStorage.mock.results[0]?.value.workspaceId).toBe(DEV_SCOPE_WORKSPACE_ID);
  });

  it("does not redirect on auth bootstrap routes", async () => {
    const replace = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, pathname: "/auth/bootstrap", replace },
    });

    await runSignedInDedicatedScopeBootstrap();

    expect(replace).not.toHaveBeenCalled();
  });
});

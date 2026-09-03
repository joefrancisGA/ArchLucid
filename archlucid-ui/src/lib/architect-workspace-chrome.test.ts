import { describe, expect, it } from "vitest";

import { resolveArchitectWorkspaceChrome } from "@/lib/architect-workspace-chrome";

describe("resolveArchitectWorkspaceChrome", () => {
  it("is true for working mode on a live shell", () => {
    expect(
      resolveArchitectWorkspaceChrome({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(true);
  });

  it("is false for guided mode", () => {
    expect(
      resolveArchitectWorkspaceChrome({
        workspaceMode: "guided",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });

  it("is false when demo or static fallback is active", () => {
    expect(
      resolveArchitectWorkspaceChrome({
        workspaceMode: "working",
        staticDemoFallback: true,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { resolveArchitectWorkspaceChrome, resolveWorkingForbidsBuyerPolish } from "@/lib/architect-workspace-chrome";

describe("resolveWorkingForbidsBuyerPolish (WS-05 / ADR 0080)", () => {
  it("is true for production Working seats", () => {
    expect(
      resolveWorkingForbidsBuyerPolish({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(true);
  });

  it("is false for Guided seats", () => {
    expect(
      resolveWorkingForbidsBuyerPolish({
        workspaceMode: "guided",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });

  it("is false when demo marketing chrome is active on Working", () => {
    expect(
      resolveWorkingForbidsBuyerPolish({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: true,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });
});

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

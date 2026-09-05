import { describe, expect, it } from "vitest";

import {
  resolveProductionDeskChrome,
  resolveProductionEvalChrome,
  resolveProductionEvalChromeForServer,
} from "@/lib/production-desk-chrome";

describe("resolveProductionDeskChrome", () => {
  it("returns true for Working mode without demo/trial/static flags", () => {
    expect(
      resolveProductionDeskChrome({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(true);
  });

  it("returns false for Guided mode (eval chrome)", () => {
    expect(
      resolveProductionDeskChrome({
        workspaceMode: "guided",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });

  it("returns false when demo marketing chrome is on", () => {
    expect(
      resolveProductionDeskChrome({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: true,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });

  it("resolveProductionEvalChromeForServer defaults Working to desk chrome on production builds", () => {
    expect(resolveProductionEvalChromeForServer("working")).toBe(false);
    expect(resolveProductionEvalChromeForServer("guided")).toBe(true);
  });

  it("resolveProductionEvalChrome is the inverse of desk chrome", () => {
    const input = {
      workspaceMode: "working" as const,
      staticDemoFallback: false,
      demoMarketingChrome: false,
      frictionlessTrial: false,
    };

    expect(resolveProductionEvalChrome(input)).toBe(!resolveProductionDeskChrome(input));
  });
});

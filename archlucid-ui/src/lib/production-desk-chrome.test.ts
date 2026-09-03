import { describe, expect, it } from "vitest";

import {
  resolveProductionDeskChrome,
  resolveProductionEvalChrome,
} from "@/lib/production-desk-chrome";

describe("production-desk-chrome", () => {
  it("returns desk chrome for Working mode on a live production seat", () => {
    expect(
      resolveProductionDeskChrome({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(true);

    expect(
      resolveProductionEvalChrome({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });

  it("returns eval chrome for Guided mode even when buyer-polished env is false", () => {
    expect(
      resolveProductionDeskChrome({
        workspaceMode: "guided",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(false);

    expect(
      resolveProductionEvalChrome({
        workspaceMode: "guided",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(true);
  });

  it("returns eval chrome for demo and trial overrides on Working seats", () => {
    expect(
      resolveProductionDeskChrome({
        workspaceMode: "working",
        demoMarketingChrome: true,
      }),
    ).toBe(false);

    expect(
      resolveProductionEvalChrome({
        workspaceMode: "working",
        frictionlessTrial: true,
      }),
    ).toBe(true);
  });
});

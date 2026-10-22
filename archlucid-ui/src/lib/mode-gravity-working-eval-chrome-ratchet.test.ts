import { describe, expect, it } from "vitest";

import { MODE_GRAVITY_ADR_0094_RELATIVE_PATH } from "@/lib/mode-gravity-adr-inventory";
import { resolveProductionEvalChrome } from "@/lib/production-desk-chrome";

/** MG-017 — WS-23 / ADR 0094: production Working eval chrome stays false. */
describe("mode-gravity Working eval chrome ratchet (MG-017)", () => {
  it("resolveProductionEvalChrome is false for production Working (ADR 0094)", () => {
    expect(
      resolveProductionEvalChrome({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });

  it("resolveProductionEvalChrome stays true for Guided", () => {
    expect(
      resolveProductionEvalChrome({
        workspaceMode: "guided",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(true);
  });

  it("cites ADR 0094 inventory path for mode-gravity wave", () => {
    expect(MODE_GRAVITY_ADR_0094_RELATIVE_PATH).toContain("0094");
  });
});

import { describe, expect, it } from "vitest";

import { MODE_GRAVITY_FIXTURE_MATRIX_ROWS } from "@/lib/mode-gravity-fixture-matrix-working-career";
import { resolveProductionEvalChrome } from "@/lib/production-desk-chrome";

describe("mode-gravity fixture matrix Working+Career (MG-010)", () => {
  it("documents Working default eval chrome false and Guided true", () => {
    const workingDefault = MODE_GRAVITY_FIXTURE_MATRIX_ROWS.find((row) => row.label === "Working+Career default");
    const guided = MODE_GRAVITY_FIXTURE_MATRIX_ROWS.find((row) => row.label === "Guided+Simulator");

    expect(workingDefault?.evalChrome).toBe(false);
    expect(guided?.evalChrome).toBe(true);

    expect(
      resolveProductionEvalChrome({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(workingDefault?.evalChrome);

    expect(
      resolveProductionEvalChrome({
        workspaceMode: "guided",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(guided?.evalChrome);
  });
});

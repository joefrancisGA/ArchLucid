import { describe, expect, it } from "vitest";

import {
  MODE_GRAVITY_EVAL_CHROME_SEATS,
  isModeGravityEvalChromeSeat,
} from "@/lib/mode-gravity-demo-trial-eval-ratchet";
import { resolveProductionEvalChrome } from "@/lib/production-desk-chrome";

describe("mode-gravity demo/trial eval ratchet (MG-006)", () => {
  it("keeps eval chrome true for Guided and demo seats", () => {
    for (const seat of MODE_GRAVITY_EVAL_CHROME_SEATS) {
      expect(isModeGravityEvalChromeSeat(seat)).toBe(true);
    }
  });

  it("keeps production Working eval chrome false (WS-23 / ADR 0094)", () => {
    expect(
      resolveProductionEvalChrome({
        workspaceMode: "working",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  CTO_DEMO_FAST_CREATE_TOTAL_MS,
  ctoDemoFastCreateStageIndex,
  getCtoDemoFastCreateDestinationHref,
} from "@/lib/cto-demo-fast-create";

describe("cto-demo-fast-create", () => {
  it("returns a tour-enabled showcase review destination", () => {
    expect(getCtoDemoFastCreateDestinationHref()).toContain("claims-intake-modernization");
    expect(getCtoDemoFastCreateDestinationHref()).toContain("ctoDemoTour=1");
  });

  it("advances stages across the 15 second window", () => {
    expect(ctoDemoFastCreateStageIndex(0)).toBe(0);
    expect(ctoDemoFastCreateStageIndex(CTO_DEMO_FAST_CREATE_TOTAL_MS - 1)).toBe(4);
  });
});

import { describe, expect, it } from "vitest";

import {
  operateNavUnlockPhaseForAdvancedFeatures,
  syncOperateNavUnlockWithAdvancedFeatures,
} from "@/lib/usability/operate-advanced-features-disclosure";
import { readOperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

describe("operate-advanced-features-disclosure", () => {
  it("maps advanced features toggle to operate nav unlock phase", () => {
    expect(operateNavUnlockPhaseForAdvancedFeatures(false)).toBe(1);
    expect(operateNavUnlockPhaseForAdvancedFeatures(true)).toBe(2);
  });

  it("persists operate unlock phase with advanced features toggle", () => {
    localStorage.clear();
    syncOperateNavUnlockWithAdvancedFeatures(true);
    expect(readOperateNavUnlockPhase()).toBe(2);
    syncOperateNavUnlockWithAdvancedFeatures(false);
    expect(readOperateNavUnlockPhase()).toBe(1);
  });
});

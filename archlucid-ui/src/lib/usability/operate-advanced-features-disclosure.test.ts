import { describe, expect, it } from "vitest";

import {
  operateNavUnlockPhaseForAdvancedFeatures,
  resolveOperateNavUnlockPhase,
  syncOperateNavUnlockWithAdvancedFeatures,
} from "@/lib/usability/operate-advanced-features-disclosure";
import { readOperateNavUnlockPhase, writeOperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

describe("operate-advanced-features-disclosure", () => {
  it("keeps pilot-only shell hidden when advanced features are off", () => {
    expect(resolveOperateNavUnlockPhase(0, false, false)).toBe(0);
    expect(operateNavUnlockPhaseForAdvancedFeatures(false)).toBe(0);
  });

  it("does not bypass pre-commit Operate hiding when advanced features toggle is on", () => {
    expect(resolveOperateNavUnlockPhase(0, true, false)).toBe(0);
  });

  it("maps advanced features toggle to full governance unlock after first commit or manual analysis unlock", () => {
    expect(resolveOperateNavUnlockPhase(0, true, true)).toBe(2);
    expect(resolveOperateNavUnlockPhase(1, true, false)).toBe(2);
  });

  it("preserves stored phase 2 for governance nav when advanced features toggle is off", () => {
    expect(resolveOperateNavUnlockPhase(2, false, false)).toBe(2);
  });

  it("persists operate unlock phase with advanced features toggle without downgrading pilot-only users", () => {
    localStorage.clear();
    syncOperateNavUnlockWithAdvancedFeatures(true);
    expect(readOperateNavUnlockPhase()).toBe(2);
    syncOperateNavUnlockWithAdvancedFeatures(false);
    expect(readOperateNavUnlockPhase()).toBe(1);

    localStorage.clear();
    writeOperateNavUnlockPhase(0);
    syncOperateNavUnlockWithAdvancedFeatures(false);
    expect(readOperateNavUnlockPhase()).toBe(0);
  });
});

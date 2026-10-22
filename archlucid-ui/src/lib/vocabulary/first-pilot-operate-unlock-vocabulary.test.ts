import { describe, expect, it } from "vitest";

import {
  FIRST_PILOT_OPERATE_UNLOCK_COMPACT_LINE,
  FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK,
  FIRST_PILOT_OPERATE_UNLOCK_HEADING,
  FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK,
  FIRST_PILOT_OPERATE_UNLOCK_WHY_TWO,
  FIRST_PILOT_SURFACE_PATH,
  OPERATE_UNLOCK_PANEL_HREF,
  buildFirstPilotOperateUnlockVocabulary,
  resolveFirstPilotOperateUnlockPeerLink,
} from "@/lib/vocabulary/first-pilot-operate-unlock-vocabulary";

describe("first-pilot-operate-unlock-vocabulary (TB-2311)", () => {
  it("explains first-pilot next-best-action vs Operate nav unlock", () => {
    const model = buildFirstPilotOperateUnlockVocabulary();

    expect(model.heading).toBe(FIRST_PILOT_OPERATE_UNLOCK_HEADING);
    expect(model.whyTwo).toBe(FIRST_PILOT_OPERATE_UNLOCK_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("next best action");
    expect(model.whyTwo.toLowerCase()).toContain("compare");
    expect(model.compactLine).toBe(FIRST_PILOT_OPERATE_UNLOCK_COMPACT_LINE);

    expect(model.firstPilotLink).toEqual(FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK);
    expect(model.firstPilotLink.href).toBe(FIRST_PILOT_SURFACE_PATH);
    expect(model.firstPilotLink.href).toBe("/");

    expect(model.operateUnlockLink).toEqual(FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK);
    expect(model.operateUnlockLink.href).toBe(OPERATE_UNLOCK_PANEL_HREF);
    expect(model.operateUnlockLink.href).toBe("#operate-features-unlock-panel");
  });

  it("resolves the peer surface from first-pilot and operate-unlock", () => {
    expect(resolveFirstPilotOperateUnlockPeerLink("first-pilot")).toEqual(
      FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK,
    );

    expect(resolveFirstPilotOperateUnlockPeerLink("operate-unlock")).toEqual(
      FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK,
    );
  });
});

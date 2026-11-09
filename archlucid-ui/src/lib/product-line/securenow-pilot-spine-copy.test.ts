import { describe, expect, it } from "vitest";

import {
  SECURENOW_PILOT_SPINE_STEPS,
  appendSecureNowWalkBeat,
  secureNowPilotSpineHandoffHrefForBeat,
  secureNowPilotSpineStepForBeat,
} from "./securenow-pilot-spine-copy";

describe("securenow-pilot-spine-copy", () => {
  it("defines six beats with walkthrough query links", () => {
    expect(SECURENOW_PILOT_SPINE_STEPS).toHaveLength(6);
    expect(secureNowPilotSpineStepForBeat(1)?.title).toBe("Scope and freshness");
    expect(secureNowPilotSpineHandoffHrefForBeat(2)).toContain("securenowWalkBeat=2");
    expect(secureNowPilotSpineHandoffHrefForBeat(2)).toContain("fixture-path-01");
  });

  it("appends beat query params without dropping hash routes", () => {
    expect(appendSecureNowWalkBeat("/path?x=1", 3)).toBe("/path?x=1&securenowWalkBeat=3");
    expect(appendSecureNowWalkBeat("/path#cut", 3)).toBe("/path?securenowWalkBeat=3#cut");
  });
});

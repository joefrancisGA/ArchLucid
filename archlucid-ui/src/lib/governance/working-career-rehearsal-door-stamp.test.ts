import { describe, expect, it } from "vitest";

import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";

describe("resolveHonestyWorkingCareerRehearsalDoor (CG-019)", () => {
  it("prefers the execute stamp over a later Career chooser", () => {
    expect(
      resolveHonestyWorkingCareerRehearsalDoor({
        stampedDoor: "rehearsal",
        liveDoor: "career",
      }),
    ).toBe("rehearsal");
  });

  it("prefers the execute stamp over a later Rehearsal chooser", () => {
    expect(
      resolveHonestyWorkingCareerRehearsalDoor({
        stampedDoor: "career",
        liveDoor: "rehearsal",
      }),
    ).toBe("career");
  });

  it("falls back to the live chooser when the run has no stamp yet", () => {
    expect(
      resolveHonestyWorkingCareerRehearsalDoor({
        stampedDoor: null,
        liveDoor: "career",
      }),
    ).toBe("career");
  });

  it("ignores unknown stamp labels", () => {
    expect(
      resolveHonestyWorkingCareerRehearsalDoor({
        stampedDoor: "simulator",
        liveDoor: "rehearsal",
      }),
    ).toBe("rehearsal");
  });
});

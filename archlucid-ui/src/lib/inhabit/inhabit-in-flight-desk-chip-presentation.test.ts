import { describe, expect, it } from "vitest";

import {
  INHABIT_IN_FLIGHT_DESK_CHIP_DETAIL_LINE,
  resolveInhabitInFlightDeskChipStamp,
} from "@/lib/inhabit/inhabit-in-flight-desk-chip-presentation";

describe("inhabit in-flight desk chip presentation (IH-031)", () => {
  it("returns Record · Simulator host stamp on Working when session is not Real", () => {
    expect(
      resolveInhabitInFlightDeskChipStamp({
        workingMode: true,
        door: "career",
        isSessionReal: false,
      }),
    ).toBe("Record · Simulator host");
  });

  it("returns Practice · Simulator host stamp for rehearsal door", () => {
    expect(
      resolveInhabitInFlightDeskChipStamp({
        workingMode: true,
        door: "rehearsal",
        isSessionReal: false,
      }),
    ).toBe("Practice · Simulator host");
  });

  it("returns null outside Working mode", () => {
    expect(
      resolveInhabitInFlightDeskChipStamp({
        workingMode: false,
        door: "career",
        isSessionReal: false,
      }),
    ).toBeNull();
  });

  it("names background wait honesty without Ready language", () => {
    expect(INHABIT_IN_FLIGHT_DESK_CHIP_DETAIL_LINE).toContain("Not ready to seal");
    expect(INHABIT_IN_FLIGHT_DESK_CHIP_DETAIL_LINE).not.toMatch(/percentComplete/i);
  });
});

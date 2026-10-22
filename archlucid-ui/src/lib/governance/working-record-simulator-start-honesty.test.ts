import { describe, expect, it } from "vitest";

import {
  shouldShowWorkingRecordSimulatorStartHonesty,
  WORKING_RECORD_SIMULATOR_START_HONESTY_SENTENCE,
} from "@/lib/governance/working-record-simulator-start-honesty";

describe("working-record-simulator-start-honesty (IH-025)", () => {
  it("shows honesty for Working Record on Simulator session", () => {
    expect(
      shouldShowWorkingRecordSimulatorStartHonesty({
        workingMode: true,
        selectedDoor: "career",
        isSessionReal: false,
      }),
    ).toBe(true);
  });

  it("hides honesty for Practice on Simulator", () => {
    expect(
      shouldShowWorkingRecordSimulatorStartHonesty({
        workingMode: true,
        selectedDoor: "rehearsal",
        isSessionReal: false,
      }),
    ).toBe(false);
  });

  it("hides honesty for Record on Real session", () => {
    expect(
      shouldShowWorkingRecordSimulatorStartHonesty({
        workingMode: true,
        selectedDoor: "career",
        isSessionReal: true,
      }),
    ).toBe(false);
  });

  it("hides honesty on Guided seats", () => {
    expect(
      shouldShowWorkingRecordSimulatorStartHonesty({
        workingMode: false,
        selectedDoor: "career",
        isSessionReal: false,
      }),
    ).toBe(false);
  });

  it("names sealed-record incompleteness without blocking language", () => {
    expect(WORKING_RECORD_SIMULATOR_START_HONESTY_SENTENCE).toMatch(/sealed-record-complete proof/i);
    expect(WORKING_RECORD_SIMULATOR_START_HONESTY_SENTENCE).toMatch(/You can start here/i);
    expect(WORKING_RECORD_SIMULATOR_START_HONESTY_SENTENCE).not.toMatch(/Career blocked/i);
  });
});

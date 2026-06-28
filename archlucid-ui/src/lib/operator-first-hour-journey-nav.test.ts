import { describe, expect, it } from "vitest";

import {
  OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS,
  resolveOperatorFirstHourJourneyNav,
} from "@/lib/operator-first-hour-journey-nav";

describe("OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS", () => {
  it("defines four canonical first-hour steps aligned to docs", () => {
    expect(OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS).toHaveLength(4);
    expect(OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS[0]?.href).toBe("/reviews/new");
    expect(OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS[3]?.href).toBe("/signed-records");
  });

  it("keeps distinct step numbers when execute and commit both route to /reviews", () => {
    const execute = OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS[1];
    const commit = OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS[2];

    expect(execute?.href).toBe("/reviews");
    expect(commit?.href).toBe("/reviews");
    expect(execute?.step).not.toBe(commit?.step);
  });
});

describe("resolveOperatorFirstHourJourneyNav", () => {
  it("returns step context on new-run route", () => {
    const nav = resolveOperatorFirstHourJourneyNav("/reviews/new");

    expect(nav).not.toBeNull();
    expect(nav?.currentStepIndex).toBe(0);
    expect(nav?.summaryLine).toContain("Step 1 of 4");
    expect(nav?.next?.href).toBe("/reviews");
  });

  it("returns hub guidance on operator home", () => {
    const nav = resolveOperatorFirstHourJourneyNav("/");

    expect(nav?.summaryLine).toContain("Pilot first");
    expect(nav?.next?.href).toBe("/reviews/new");
  });
});

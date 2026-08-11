import { describe, expect, it } from "vitest";

import {
  ADVISORY_RESULTS_SCHEDULES_COMPACT_LINE,
  ADVISORY_RESULTS_SCHEDULES_HEADING,
  ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK,
  ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK,
  ADVISORY_RESULTS_SCHEDULES_WHY_TWO,
  buildAdvisoryResultsSchedulesVocabulary,
  resolveAdvisoryResultsSchedulesPeerLink,
} from "@/lib/vocabulary/advisory-results-schedules-vocabulary";
import {
  ADVISORY_SCANS_SCANS_HREF,
  ADVISORY_SCANS_SCHEDULES_HREF,
} from "@/lib/advisory-scans-route";

describe("advisory-results-schedules-vocabulary (TB-2280)", () => {
  it("explains advisory results vs schedules and deep-links both tabs", () => {
    const model = buildAdvisoryResultsSchedulesVocabulary();

    expect(model.heading).toBe(ADVISORY_RESULTS_SCHEDULES_HEADING);
    expect(model.heading.toLowerCase()).toContain("advisory results");
    expect(model.heading.toLowerCase()).toContain("advisory schedules");
    expect(model.whyTwo).toBe(ADVISORY_RESULTS_SCHEDULES_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("finding");
    expect(model.whyTwo.toLowerCase()).toContain("cadence");
    expect(model.compactLine).toBe(ADVISORY_RESULTS_SCHEDULES_COMPACT_LINE);

    expect(model.resultsLink).toEqual(ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK);
    expect(model.resultsLink.href).toBe(ADVISORY_SCANS_SCANS_HREF);
    expect(model.resultsLink.href).toBe("/governance/advisory-scans?tab=scans");

    expect(model.schedulesLink).toEqual(ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK);
    expect(model.schedulesLink.href).toBe(ADVISORY_SCANS_SCHEDULES_HREF);
    expect(model.schedulesLink.href).toBe("/governance/advisory-scans?tab=schedules");
  });

  it("resolves the peer surface from results and schedules", () => {
    expect(resolveAdvisoryResultsSchedulesPeerLink("advisory-results")).toEqual(
      ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK,
    );

    expect(resolveAdvisoryResultsSchedulesPeerLink("advisory-schedules")).toEqual(
      ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK,
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  resolveSignedRecordsFilterEmphasizedStepId,
  resolveSignedRecordsFilterSteps,
} from "./signed-records-filter-checklist";

describe("signed-records-filter-checklist", () => {
  it("emphasizes records after a review is picked", () => {
    expect(
      resolveSignedRecordsFilterEmphasizedStepId({
        reviewPicked: true,
        recordsLoaded: false,
        filterReady: false,
      }),
    ).toBe("records");
  });

  it("marks all steps complete when a filtered record is ready", () => {
    const steps = resolveSignedRecordsFilterSteps({
      reviewPicked: true,
      recordsLoaded: true,
      filterReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveSignedRecordsFilterEmphasizedStepId({
        reviewPicked: true,
        recordsLoaded: true,
        filterReady: true,
      }),
    ).toBe("filter");
  });
});

import { describe, expect, it } from "vitest";

import {
  resolveManifestDetailInspectEmphasizedStepId,
  resolveManifestDetailInspectSteps,
} from "./manifest-detail-inspect-checklist";

describe("manifest-detail-inspect-checklist", () => {
  it("emphasizes deliverables when record is loaded but artifacts are empty", () => {
    expect(
      resolveManifestDetailInspectEmphasizedStepId({
        reviewPicked: true,
        recordLoaded: true,
        deliverablesReady: false,
      }),
    ).toBe("deliverables");
  });

  it("marks all steps complete when deliverables are ready", () => {
    const steps = resolveManifestDetailInspectSteps({
      reviewPicked: true,
      recordLoaded: true,
      deliverablesReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });
});

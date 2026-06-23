import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_FINAL_STEP_INDEX,
  resolveCorePilotStepPresentation,
} from "@/lib/core-pilot-step-presentation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("resolveCorePilotStepPresentation", () => {
  it("returns default step action for non-final steps", () => {
    const presentation = resolveCorePilotStepPresentation(0, {
      hasCommittedManifest: false,
      latestCommittedRunId: null,
    });

    expect(presentation.label).toBe("Start a review");
    expect(presentation.href).toBe("/reviews/new");
  });

  it("links final step to sample review when tenant has no committed package", () => {
    const presentation = resolveCorePilotStepPresentation(CORE_PILOT_FINAL_STEP_INDEX, {
      hasCommittedManifest: false,
      latestCommittedRunId: null,
    });

    expect(presentation.label).toBe("Open sample finalized review");
    expect(presentation.href).toBe(`/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`);
  });

  it("links final step to committed review when tenant has a package", () => {
    const runId = "run-committed-001";
    const presentation = resolveCorePilotStepPresentation(CORE_PILOT_FINAL_STEP_INDEX, {
      hasCommittedManifest: true,
      latestCommittedRunId: runId,
    });

    expect(presentation.label).toBe("Open finalized review");
    expect(presentation.href).toBe(`/reviews/${runId}`);
  });
});

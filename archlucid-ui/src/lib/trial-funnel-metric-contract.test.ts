import { describe, expect, it } from "vitest";

import {
  TRIAL_FUNNEL_PAGE_SUBTITLE,
  TRIAL_FUNNEL_STAGE_DEFINITIONS,
  trialFunnelStageDefinition,
} from "@/lib/trial-funnel-metric-contract";

describe("trial-funnel-metric-contract", () => {
  it("does not reference deferred checkout or Stripe implementation language", () => {
    const corpus = [
      TRIAL_FUNNEL_PAGE_SUBTITLE,
      ...TRIAL_FUNNEL_STAGE_DEFINITIONS.map((stage) => stage.definition),
      ...TRIAL_FUNNEL_STAGE_DEFINITIONS.map((stage) => stage.qualifyingEvent),
    ].join(" ");

    expect(corpus.toLowerCase()).not.toContain("stripe");
    expect(corpus.toLowerCase()).not.toContain("deferred");
    expect(corpus.toLowerCase()).not.toContain("first commit");
  });

  it("defines first review finalized instead of first commit", () => {
    const stage = trialFunnelStageDefinition("first-review-finalized");

    expect(stage?.label).toBe("First review finalized");
    expect(stage?.qualifyingEvent).toContain("TrialFirstRunCompleted");
  });
});

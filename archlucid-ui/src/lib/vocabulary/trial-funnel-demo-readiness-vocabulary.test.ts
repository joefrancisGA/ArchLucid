import { describe, expect, it } from "vitest";

import {
  TRIAL_FUNNEL_DEMO_READINESS_COMPACT_LINE,
  TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK,
  TRIAL_FUNNEL_DEMO_READINESS_HEADING,
  TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK,
  TRIAL_FUNNEL_DEMO_READINESS_WHY_TWO,
  buildTrialFunnelDemoReadinessVocabulary,
  resolveTrialFunnelDemoReadinessPeerLink,
} from "@/lib/vocabulary/trial-funnel-demo-readiness-vocabulary";
import {
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";

describe("trial-funnel-demo-readiness-vocabulary (TB-2266)", () => {
  it("explains trial funnel conversion metrics vs demo readiness preflight", () => {
    const model = buildTrialFunnelDemoReadinessVocabulary();

    expect(model.heading).toBe(TRIAL_FUNNEL_DEMO_READINESS_HEADING);
    expect(model.heading.toLowerCase()).toContain("trial funnel");
    expect(model.heading.toLowerCase()).toContain("demo readiness");
    expect(model.whyTwo).toBe(TRIAL_FUNNEL_DEMO_READINESS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("conversion");
    expect(model.whyTwo.toLowerCase()).toContain("preflight");
    expect(model.compactLine).toBe(TRIAL_FUNNEL_DEMO_READINESS_COMPACT_LINE);

    expect(model.trialFunnelLink).toEqual(TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK);
    expect(model.trialFunnelLink.href).toBe(INTERNAL_TRIAL_FUNNEL_PATH);
    expect(model.trialFunnelLink.href).toBe("/internal/trial-funnel");

    expect(model.demoReadinessLink).toEqual(TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK);
    expect(model.demoReadinessLink.href).toBe(INTERNAL_DEMO_READINESS_PATH);
    expect(model.demoReadinessLink.href).toBe("/internal/demo-readiness");
  });

  it("resolves the peer surface from trial-funnel and demo-readiness", () => {
    expect(resolveTrialFunnelDemoReadinessPeerLink("trial-funnel")).toEqual(
      TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK,
    );
    expect(resolveTrialFunnelDemoReadinessPeerLink("demo-readiness")).toEqual(
      TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK,
    );
  });
});

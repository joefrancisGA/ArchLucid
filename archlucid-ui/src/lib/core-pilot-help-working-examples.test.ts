import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  CORE_PILOT_HELP_WORKING_STEPPER_REPLACEMENT_COPY,
  resolveCorePilotHelpPrimaryActions,
  resolveCorePilotHelpWorkflowSteps,
} from "@/lib/core-pilot-help-guide-content";
import { resolveShowcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { WORKING_REVIEWS_INBOX_NAV_LABEL } from "@/lib/operator/operator-nav-labels";
import { resolveFirstWeekRouteGuidanceForShell } from "@/lib/first-week-route-guidance";

describe("core-pilot help Working examples (SG-058 / SG-056 / SG-063)", () => {
  it("SG-058: uses architecture nested URLs in Working workflow steps instead of peer review Home links", () => {
    const steps = resolveCorePilotHelpWorkflowSteps(true);

    expect(steps[0]?.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(steps[1]?.href).toBe(ARCHITECTURES_NEW_PATH);
    expect(steps[4]?.href).toBe(REVIEWS_LIST_PATH);
    expect(steps[4]?.ctaLabel).toBe(WORKING_REVIEWS_INBOX_NAV_LABEL);

    for (const step of steps) {
      expect(step.href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
    }
  });

  it("SG-063: Working sample review CTA opens architecture portfolio", () => {
    expect(resolveShowcaseSampleReviewPackageHref(true)).toBe(ARCHITECTURES_LIST_PATH);
    expect(resolveShowcaseSampleReviewPackageHref(false)).toMatch(/^\/architecture\/reviews\//);

    const sampleAction = resolveCorePilotHelpPrimaryActions(true).sampleReview;

    expect(sampleAction.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(sampleAction.label).toMatch(/architecture desk/i);
  });

  it("SG-056: Working home guidance is desk-oriented, not pipeline stepper theater", () => {
    const homeGuidance = resolveFirstWeekRouteGuidanceForShell("home", { evalChrome: false });

    expect(homeGuidance.primaryAction?.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(homeGuidance.bridgeCopy).toMatch(/architecture portfolio/i);
    expect(homeGuidance.bridgeCopy).not.toMatch(/same object from capture through finalized review record/i);
  });

  it("SG-061: Working onboarding guidance points at architecture desk, not reviews hub Home", () => {
    const onboardingGuidance = resolveFirstWeekRouteGuidanceForShell("onboarding", { evalChrome: false });

    expect(onboardingGuidance.primaryAction?.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(onboardingGuidance.bridgeCopy).toMatch(/architecture desk/i);
    expect(onboardingGuidance.bridgeCopy).toMatch(/not the reviews inbox as Home/i);
  });

  it("documents Working stepper replacement copy for core pilot help", () => {
    expect(CORE_PILOT_HELP_WORKING_STEPPER_REPLACEMENT_COPY).toMatch(/architecture desk/i);
    expect(CORE_PILOT_HELP_WORKING_STEPPER_REPLACEMENT_COPY).not.toMatch(/five steps in order/i);
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WizardStepDefinition } from "@/lib/wizard-step-sequence";

import { useWizardStepNavigation } from "./use-wizard-step-navigation";

const trackWizardStepViewed = vi.fn();

vi.mock("@/lib/telemetry", () => ({
  trackWizardStepViewed: (...args: unknown[]) => trackWizardStepViewed(...args),
}));

const STEPS: readonly WizardStepDefinition[] = [
  { label: "Intent", description: "Describe the change" },
  { label: "Clarifications", description: "Answer follow-ups" },
  { label: "Review", description: "Confirm and submit" },
];

describe("useWizardStepNavigation", () => {
  it("tracks the initial step and treats the last index as review by default", () => {
    const { result } = renderHook(() =>
      useWizardStepNavigation({
        steps: STEPS,
        telemetryWizardName: "TestIntake",
      }),
    );

    expect(result.current.stepIndex).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isReviewStep).toBe(false);
    expect(trackWizardStepViewed).toHaveBeenCalledWith(0, "Intent", "TestIntake");
  });

  it("honors a custom review step index", () => {
    const { result } = renderHook(() =>
      useWizardStepNavigation({
        steps: STEPS,
        telemetryWizardName: "FullGuided",
        reviewStepIndex: 1,
      }),
    );

    act(() => {
      result.current.goToStep(1);
    });

    expect(result.current.isReviewStep).toBe(true);
    expect(result.current.stepIndex).toBe(1);
  });

  it("never walks back past the first step or forward past the last", () => {
    const { result } = renderHook(() =>
      useWizardStepNavigation({
        steps: STEPS,
        telemetryWizardName: "TestIntake",
      }),
    );

    act(() => {
      result.current.goBack();
    });

    expect(result.current.stepIndex).toBe(0);

    act(() => {
      result.current.goToStep(2);
      result.current.advance();
    });

    expect(result.current.stepIndex).toBe(2);
  });
});

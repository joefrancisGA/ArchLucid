import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseFormReset } from "react-hook-form";

import { useNewRunWizardQueryPrefill } from "@/app/(operator)/architecture/reviews/new/use-new-run-wizard-query-prefill";
import type { WizardFormValues } from "@/lib/wizard-schema";

function buildParams(acceleratorPackId: string | null) {
  return {
    acceleratorPackId,
    baselineFirst: false,
    deeplinkPolicyPackId: null,
    exampleTemplate: null,
    presetDeeplinkPresetId: null,
    presetDeeplinkToken: null,
    reviewIntakeCloudProvider: null,
    zeroConfigDemo: false,
    zeroConfigSelection: { platform: "aws" as const, tier: "tier1" as const },
    featuredSampleRunId: null,
    followUpSourceRunId: null,
  };
}

describe("useNewRunWizardQueryPrefill", () => {
  it("applies accelerator prefill only once when goToStep identity changes", async () => {
    const reset = vi.fn<UseFormReset<WizardFormValues>>();
    const persistWizardMode = vi.fn();
    let goToStep = vi.fn();

    const { rerender } = renderHook(
      ({ stepGoTo }: { stepGoTo: (index: number) => void }) =>
        useNewRunWizardQueryPrefill({
          params: buildParams("ai-llm-workload"),
          stepIndex: 0,
          wizardMode: "full",
          reset,
          setValue: vi.fn(),
          goToStep: stepGoTo,
          persistWizardMode,
          onPendingEvidenceFileChange: vi.fn(),
          showToast: vi.fn(),
        }),
      {
        initialProps: { stepGoTo: goToStep },
      },
    );

    await waitFor(() => {
      expect(reset).toHaveBeenCalledTimes(1);
    });

    goToStep = vi.fn();
    rerender({ stepGoTo: goToStep });

    await waitFor(() => {
      expect(reset).toHaveBeenCalledTimes(1);
    });

    expect(goToStep).not.toHaveBeenCalled();
    expect(persistWizardMode).toHaveBeenCalledTimes(1);
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseFormReset } from "react-hook-form";

import { useNewRunWizardQueryPrefill } from "@/app/(operator)/architecture/reviews/new/use-new-run-wizard-query-prefill";
import { REVIEW_INTAKE_EXAMPLE_TEMPLATES } from "@/lib/operator/operator-home-example-request";
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

  it("applies example template prefill once after full wizard reaches step 2", async () => {
    const exampleTemplate = REVIEW_INTAKE_EXAMPLE_TEMPLATES[0]!;
    const setValue = vi.fn();

    const { rerender } = renderHook(
      ({ stepIndex }: { stepIndex: number }) =>
        useNewRunWizardQueryPrefill({
          params: {
            ...buildParams(null),
            exampleTemplate,
          },
          stepIndex,
          wizardMode: "full",
          reset: vi.fn(),
          setValue,
          goToStep: vi.fn(),
          persistWizardMode: vi.fn(),
          onPendingEvidenceFileChange: vi.fn(),
          showToast: vi.fn(),
        }),
      { initialProps: { stepIndex: 0 } },
    );

    await waitFor(() => {
      expect(setValue).not.toHaveBeenCalled();
    });

    rerender({ stepIndex: 2 });

    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith("systemName", exampleTemplate.systemName, {
        shouldValidate: true,
        shouldDirty: true,
      });
      expect(setValue).toHaveBeenCalledWith("description", exampleTemplate.briefText, {
        shouldValidate: true,
        shouldDirty: true,
      });
    });

    rerender({ stepIndex: 2 });

    await waitFor(() => {
      expect(setValue).toHaveBeenCalledTimes(2);
    });
  });

  it("prefills policyReferences from deeplink policyPackId without client-side catalog validation", async () => {
    const setValue = vi.fn();

    renderHook(() =>
      useNewRunWizardQueryPrefill({
        params: {
          ...buildParams(null),
          deeplinkPolicyPackId: "retired-pack-typo",
        },
        stepIndex: 0,
        wizardMode: "full",
        reset: vi.fn(),
        setValue,
        goToStep: vi.fn(),
        persistWizardMode: vi.fn(),
        onPendingEvidenceFileChange: vi.fn(),
        showToast: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith("policyReferences", ["retired-pack-typo"], {
        shouldValidate: true,
        shouldDirty: true,
      });
    });
  });

  it("applies accelerator prefill and skips preset when both query params are present", async () => {
    const reset = vi.fn<UseFormReset<WizardFormValues>>();

    renderHook(() =>
      useNewRunWizardQueryPrefill({
        params: {
          ...buildParams("ai-llm-workload"),
          presetDeeplinkPresetId: "greenfield",
          presetDeeplinkToken: "greenfield",
        },
        stepIndex: 0,
        wizardMode: "full",
        reset,
        setValue: vi.fn(),
        goToStep: vi.fn(),
        persistWizardMode: vi.fn(),
        onPendingEvidenceFileChange: vi.fn(),
        showToast: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });
});

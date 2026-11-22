import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildDefaultWizardValues, type WizardFormValues } from "@/lib/wizard-schema";

type TemplateRestoreArgs = {
  readonly onRestore: (snapshot: { stepIndex: number; state: WizardFormValues }) => void;
};

let templateRestoreArgs: TemplateRestoreArgs | null = null;

vi.mock("@/hooks/use-reviews-new-suppress-wizard-resume-prompt", () => ({
  useReviewsNewSuppressWizardResumePrompt: () => false,
}));

vi.mock("@/hooks/use-wizard-session-persistence", () => ({
  useWizardSessionPersistence: (args: TemplateRestoreArgs) => {
    templateRestoreArgs = args;

    return {
      saveState: "idle",
      lastSavedUtc: null,
      pendingRestore: null,
      acceptRestore: vi.fn(),
      dismissRestore: vi.fn(),
      clearSession: vi.fn(),
    };
  },
}));

import { useNewRunWizardTemplateRestore } from "./NewRunWizardTemplateRestore";

describe("useNewRunWizardTemplateRestore", () => {
  beforeEach(() => {
    templateRestoreArgs = null;
  });

  it("restores saved template form values wholesale via reset", () => {
    const reset = vi.fn();
    const setStepIndex = vi.fn();
    const savedState: WizardFormValues = {
      ...buildDefaultWizardValues(),
      systemName: "Resumed template system",
      policyReferences: ["template-pack-only"],
    };

    renderHook(() =>
      useNewRunWizardTemplateRestore({
        stepIndex: 0,
        wizardStepCount: 9,
        templateWizardSessionState: buildDefaultWizardValues(),
        showFullWizardShell: true,
        reset,
        setStepIndex,
        getValues: () => buildDefaultWizardValues(),
      }),
    );

    act(() => {
      templateRestoreArgs?.onRestore({ stepIndex: 2, state: savedState });
    });

    expect(setStepIndex).toHaveBeenCalledWith(2);
    expect(reset).toHaveBeenCalledWith(savedState);
  });

  it("clamps restored step index to the current wizard definition length", () => {
    const reset = vi.fn();
    const setStepIndex = vi.fn();
    const savedState: WizardFormValues = {
      ...buildDefaultWizardValues(),
      systemName: "Resumed on old step rail",
    };

    renderHook(() =>
      useNewRunWizardTemplateRestore({
        stepIndex: 0,
        wizardStepCount: 9,
        templateWizardSessionState: buildDefaultWizardValues(),
        showFullWizardShell: true,
        reset,
        setStepIndex,
        getValues: () => buildDefaultWizardValues(),
      }),
    );

    act(() => {
      templateRestoreArgs?.onRestore({ stepIndex: 99, state: savedState });
    });

    expect(setStepIndex).toHaveBeenCalledWith(8);
    expect(reset).toHaveBeenCalledWith(savedState);
  });

  it("reports an explicit draft save failure when session storage rejects the write", () => {
    const values = buildDefaultWizardValues();
    const { result } = renderHook(() =>
      useNewRunWizardTemplateRestore({
        stepIndex: 1,
        wizardStepCount: 9,
        templateWizardSessionState: values,
        showFullWizardShell: true,
        reset: vi.fn(),
        setStepIndex: vi.fn(),
        getValues: () => values,
      }),
    );
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("Storage quota reached", "QuotaExceededError");
    });

    try {
      act(() => result.current.saveWizardDraft());
      expect(result.current.draftSaveFeedback).toEqual({
        kind: "err",
        message: "Could not save architecture draft.",
      });
    } finally {
      write.mockRestore();
    }
  });
});

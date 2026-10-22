import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createDefaultSsoWizardState, type SsoWizardState } from "./sso-wizard-state";
import { useSsoWizardStepState } from "./useSsoWizardStepState";

function stateWith(overrides: Partial<SsoWizardState>): SsoWizardState {
  return { ...createDefaultSsoWizardState(), ...overrides };
}

describe("useSsoWizardStepState", () => {
  it("tracks completed steps from wizard state", () => {
    const { result } = renderHook(() =>
      useSsoWizardStepState({
        state: stateWith({
          idpPresetId: "entra",
          protocol: "oidc",
          issuerUri: "https://login.example.com",
          claimMapping: {
            roleClaimName: "groups",
            mappings: [{ idpValue: "admins", archLucidRole: "Admin" }],
          },
        }),
        busy: false,
      }),
    );

    expect(result.current.completedSteps).toEqual([0, 1, 2, 3]);
    expect(result.current.canProceed).toBe(true);
  });

  it("advances and goes back while clearing via onBeforeStepChange", () => {
    const seen: string[] = [];

    const { result } = renderHook(() =>
      useSsoWizardStepState({
        state: stateWith({ idpPresetId: "entra" }),
        busy: false,
        onBeforeStepChange: () => {
          seen.push("clear");
        },
      }),
    );

    expect(result.current.step).toBe(0);
    expect(result.current.canProceed).toBe(true);

    act(() => {
      result.current.handleContinue();
    });

    expect(result.current.step).toBe(1);
    expect(seen).toEqual(["clear"]);

    act(() => {
      result.current.handleBack();
    });

    expect(result.current.step).toBe(0);
    expect(seen).toEqual(["clear", "clear"]);
  });

  it("blocks stepper jumps to future steps", () => {
    const { result } = renderHook(() =>
      useSsoWizardStepState({
        state: createDefaultSsoWizardState(),
        busy: false,
      }),
    );

    act(() => {
      result.current.handleStepSelect(3);
    });

    expect(result.current.step).toBe(0);
  });
});

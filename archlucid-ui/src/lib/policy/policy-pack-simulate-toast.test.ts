import { describe, expect, it, vi } from "vitest";

import {
  presentPolicyPackSimulateToast,
  resolvePolicyPackSimulateToastOutcome,
} from "@/lib/policy/policy-pack-simulate-toast";

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { showError, showSuccess } from "@/lib/toast";

describe("resolvePolicyPackSimulateToastOutcome", () => {
  it("returns success only when the gate allows and no checks failed", () => {
    expect(
      resolvePolicyPackSimulateToastOutcome({
        gateResult: { blocked: false, warnOnly: false },
        failedChecks: [],
      }),
    ).toEqual({
      kind: "success",
      message: "Policy validation completed.",
    });
  });

  it("returns warning when the gate would block commit", () => {
    expect(
      resolvePolicyPackSimulateToastOutcome({
        gateResult: { blocked: true, warnOnly: false },
        failedChecks: ["critical"],
      }).kind,
    ).toBe("warning");
  });

  it("returns warning when failed checks exist without an explicit block flag", () => {
    expect(
      resolvePolicyPackSimulateToastOutcome({
        gateResult: { blocked: false, warnOnly: true },
        failedChecks: ["control.a"],
      }).message,
    ).toMatch(/1 failed check/);
  });
});

describe("presentPolicyPackSimulateToast", () => {
  it("does not show a success toast when validation would block commit", () => {
    vi.clearAllMocks();

    presentPolicyPackSimulateToast({
      gateResult: { blocked: true, warnOnly: false },
      failedChecks: ["critical"],
    });

    expect(showSuccess).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(
      expect.stringMatching(/would block commit/i),
      undefined,
      { type: "warning" },
    );
  });

  it("allows a custom success message when the gate allows", () => {
    vi.clearAllMocks();

    presentPolicyPackSimulateToast(
      {
        gateResult: { blocked: false, warnOnly: false },
        failedChecks: [],
      },
      { successMessage: "Policy test completed for the selected review." },
    );

    expect(showSuccess).toHaveBeenCalledWith("Policy test completed for the selected review.");
  });
});

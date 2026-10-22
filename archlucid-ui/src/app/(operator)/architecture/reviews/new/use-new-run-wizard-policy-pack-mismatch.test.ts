import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildDefaultWizardValues } from "@/lib/wizard-schema";

import { useNewRunWizardPolicyPackMismatch } from "./use-new-run-wizard-policy-pack-mismatch";

describe("useNewRunWizardPolicyPackMismatch", () => {
  it("recomputes mismatch when template session state updates on the same mount", () => {
    const payloadOptions = { requestSource: "wizard" as const, focusedPilotModeEnabled: false };

    const initialValues = {
      ...buildDefaultWizardValues(),
      cloudProvider: "None",
      policyReferences: [] as string[],
    };

    const { result, rerender } = renderHook(
      ({ values }) => useNewRunWizardPolicyPackMismatch(values, payloadOptions),
      { initialProps: { values: initialValues } },
    );

    expect(result.current).toBeNull();

    rerender({
      values: {
        ...initialValues,
        policyReferences: ["cis-azure-baseline"],
      },
    });

    expect(result.current).toContain("cloud-neutral");
  });
});

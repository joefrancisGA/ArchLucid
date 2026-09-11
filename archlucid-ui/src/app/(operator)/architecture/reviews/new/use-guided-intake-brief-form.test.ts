import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_INTAKE_EXAMPLE_TEMPLATES } from "@/lib/operator/operator-home-example-request";

import { GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER } from "@/lib/guided-intake-copy";

import { resetGuidedIntakeExampleTemplatePrefillAppliedIdsForTests } from "./guided-intake-example-template-prefill-once";
import { useGuidedIntakeBriefForm } from "./use-guided-intake-brief-form";

const replaceMock = vi.fn();
const useSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => useSearchParams(),
}));

describe("useGuidedIntakeBriefForm", () => {
  const exampleTemplate =
    REVIEW_INTAKE_EXAMPLE_TEMPLATES.find((row) => row.id === "customer-intake-modernization") ??
    REVIEW_INTAKE_EXAMPLE_TEMPLATES[0]!;

  beforeEach(() => {
    replaceMock.mockReset();
    useSearchParams.mockReturnValue(new URLSearchParams());
    resetGuidedIntakeExampleTemplatePrefillAppliedIdsForTests();
  });

  it("blocks advance when scopeGate URL is set but scope bullets are not confirmed", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("scopeGate=1"));

    const { result } = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate: null,
        isCreateArchitectureFlow: false,
      }),
    );

    expect(result.current.scopeGateOpen).toBe(true);
    expect(result.current.scopeBullets).toEqual([]);
    expect(result.current.advanceBlockers).toContain(GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER);
  });

  it("clears scope confirmation blocker when scope bullets are confirmed after scopeGate URL prefill", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("scopeGate=1"));

    const { result } = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate: null,
        isCreateArchitectureFlow: false,
      }),
    );

    act(() => {
      result.current.setScopeBullets([
        {
          id: "scope-1",
          kind: "system",
          label: "Primary System or Architecture",
          value: "Retail API",
          source: "inferred",
        },
      ]);
    });

    expect(result.current.scopeGateOpen).toBe(true);
    expect(result.current.advanceBlockers).not.toContain(GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER);
  });

  it("applies example template prefill only once across hook remounts", async () => {
    const first = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate,
        isCreateArchitectureFlow: false,
      }),
    );

    await waitFor(() => {
      expect(first.result.current.freeTextIntent).toBe(exampleTemplate.briefText);
    });

    act(() => {
      first.result.current.setFreeTextIntent("Operator-edited intent");
      first.result.current.setBusinessOutcome("Operator-edited outcome");
      first.result.current.setSystemName("Operator-edited system");
    });

    first.unmount();

    const second = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate,
        isCreateArchitectureFlow: false,
      }),
    );

    await waitFor(() => {
      expect(second.result.current.freeTextIntent).toBe("");
    });

    expect(second.result.current.businessOutcome).toBe("");
    expect(second.result.current.systemName).toBe("");
  });
});

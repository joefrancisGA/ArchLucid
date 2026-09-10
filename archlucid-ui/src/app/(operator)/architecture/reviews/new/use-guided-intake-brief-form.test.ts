import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_INTAKE_EXAMPLE_TEMPLATES } from "@/lib/operator/operator-home-example-request";

import { resetGuidedIntakeExampleTemplatePrefillAppliedIdsForTests } from "./guided-intake-example-template-prefill-once";
import { useGuidedIntakeBriefForm } from "./use-guided-intake-brief-form";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(),
}));

describe("useGuidedIntakeBriefForm", () => {
  const exampleTemplate =
    REVIEW_INTAKE_EXAMPLE_TEMPLATES.find((row) => row.id === "customer-intake-modernization") ??
    REVIEW_INTAKE_EXAMPLE_TEMPLATES[0]!;

  beforeEach(() => {
    replaceMock.mockReset();
    resetGuidedIntakeExampleTemplatePrefillAppliedIdsForTests();
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

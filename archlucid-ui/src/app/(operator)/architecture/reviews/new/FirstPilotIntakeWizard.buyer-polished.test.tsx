import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams("path=quick-review"),
    usePathname: () => "/architecture/reviews/new",
  };
});

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    loading: false,
    status: null,
    blocksLlmExecution: false,
  }),
}));

vi.mock("@/hooks/use-reviews-new-suppress-wizard-resume-prompt", () => ({
  useReviewsNewSuppressWizardResumePrompt: () => false,
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");

  return createCorePilotCommitContextModuleMock(importOriginal);
});

vi.mock("./QuickReviewWizardDeferredPanels", () => ({
  WizardEvidenceUploadZone: () => <div data-testid="first-pilot-upload-stub" />,
}));

import { FirstPilotIntakeWizard } from "./FirstPilotIntakeWizard";

describe("FirstPilotIntakeWizard buyer-polished shell (REQ)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("hides expert intake posture toggle in buyer-polished quick-start tab", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.getByTestId("first-pilot-intake-wizard")).toBeInTheDocument();
    expect(screen.queryByTestId("expert-intake-posture-toggle")).not.toBeInTheDocument();
  });
});

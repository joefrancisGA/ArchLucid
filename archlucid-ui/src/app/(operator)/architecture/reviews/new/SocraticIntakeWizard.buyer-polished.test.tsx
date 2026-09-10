import { render, screen, waitFor, within } from "@testing-library/react";
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
    useSearchParams: () => ({
      get: () => null,
      toString: () => "path=guided-intake",
    }),
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

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: () => ({ isSimulator: false }),
}));

vi.mock("@/hooks/use-inferred-universal-intake-answers", () => ({
  useInferredUniversalIntakeAnswers: () => ({
    inferredQuestionKeys: new Set<string>(),
    rephrasedQuestionKeys: new Set<string>(),
    isExtractingEvidenceText: false,
    clarificationSuggestionsUnavailable: false,
    canSuggestFromEvidence: false,
    suggestAnswersFromEvidence: vi.fn(),
    markQuestionEdited: vi.fn(),
    evidenceExtractionProgress: {
      begin: vi.fn(),
      reportStage: vi.fn(),
      reportExtractedCharacters: vi.fn(),
      complete: vi.fn(),
    },
  }),
}));

vi.mock("@/hooks/use-reviews-new-suppress-wizard-resume-prompt", () => ({
  useReviewsNewSuppressWizardResumePrompt: () => false,
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");

  return createCorePilotCommitContextModuleMock(importOriginal);
});

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { REVIEWS_NEW_ORIENTATION_SOURCES } from "@/lib/reviews-new-evidence-copy";

import { SocraticIntakeWizard } from "./SocraticIntakeWizard";

describe("SocraticIntakeWizard buyer-polished shell (ENE)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders orientation above scope step and Sources links in buyer-polished mode", async () => {
    render(<SocraticIntakeWizard />);

    await waitFor(() => {
      expect(screen.getByTestId("guided-intake-primary-panel")).toBeInTheDocument();
    });

    const wizard = screen.getByTestId("socratic-intake-wizard");
    const mainColumn = wizard.firstElementChild as HTMLElement;
    const orientationTop = screen.getByTestId("reviews-new-orientation-top");
    const scopePanel = screen.getByTestId("guided-intake-primary-panel");
    const sourcesSection = screen.getByTestId("reviews-new-settings-sources");

    expect(mainColumn).toContainElement(orientationTop);
    expect(mainColumn).toContainElement(scopePanel);
    expect(orientationTop.compareDocumentPosition(scopePanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(orientationTop).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(REVIEWS_NEW_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION } from "@/lib/guided-intake-copy";

import { SocraticIntakeWizardStepClarifications } from "./SocraticIntakeWizardStepClarifications";

const sampleQuestion = {
  questionKey: "q1",
  prompt: "Who owns production support?",
  tier: "must" as const,
  answerKind: "freeText" as const,
  source: "L0Universal" as const,
  ruleKeys: [],
};

const baseProps = {
  isCreateArchitectureFlow: false,
  activePendingQuestions: [sampleQuestion],
  primaryPendingQuestion: sampleQuestion,
  otherPendingQuestions: [],
  pendingQuestions: [sampleQuestion],
  answers: {},
  setAnswers: vi.fn(),
  viewAllClarifications: false,
  setViewAllClarifications: vi.fn(),
  totalRequiredClarifications: 1,
  handledClarificationCount: 0,
  allClarificationsHandled: false,
  getClarificationOrdinal: () => 1,
  getClarificationStatus: () => undefined,
  inferredQuestionKeys: new Set<string>(),
  rephrasedQuestionKeys: new Set<string>(),
  isExtractingEvidenceText: false,
  canSuggestFromEvidence: false,
  isSimulator: false,
  clarificationSuggestionsUnavailable: false,
  busy: false,
  submitError: null,
  canReviewAnswers: false,
  isSubmitBlocked: false,
  suggestAnswersFromEvidence: vi.fn(),
  markQuestionEdited: vi.fn(),
  saveAndContinue: vi.fn(),
  skipQuestion: vi.fn().mockResolvedValue(undefined),
  reviewAnswers: vi.fn().mockResolvedValue(undefined),
  onAdvanceToConfirm: vi.fn(),
};

describe("SocraticIntakeWizardStepClarifications", () => {
  it("renders the clarifications card and sticky footer", () => {
    render(<SocraticIntakeWizardStepClarifications {...baseProps} />);

    expect(screen.getByTestId("socratic-clarifications-step")).toBeInTheDocument();
    const card = screen.getByTestId("guided-intake-primary-panel");
    expect(card).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Required clarifications" })).toBeInTheDocument();
    expect(card).toContainElement(screen.getByTestId("wizard-sticky-footer"));
    expect(screen.getByTestId("socratic-questions-done")).toBeInTheDocument();
    expect(screen.getByText("Who owns production support?")).toBeInTheDocument();
  });

  it("uses creation-flow copy when starting an architecture draft", () => {
    render(<SocraticIntakeWizardStepClarifications {...baseProps} isCreateArchitectureFlow />);

    expect(screen.getByText(new RegExp(GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION))).toBeInTheDocument();
  });
});

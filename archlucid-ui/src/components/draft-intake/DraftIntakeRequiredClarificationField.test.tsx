import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  DraftIntakeRequiredClarificationField,
  REQUIRED_CLARIFICATION_BASELINE_LABEL,
} from "./DraftIntakeRequiredClarificationField";

const sampleQuestion = {
  questionKey: "l0.pillar.security",
  prompt: "How is data protected?",
  tier: "Must" as const,
  answerKind: "FreeText" as const,
  source: "L0Universal" as const,
  ruleKeys: [],
};

describe("DraftIntakeRequiredClarificationField", () => {
  it("shows baseline label, save-and-continue primary action, and skip link", () => {
    render(
      <DraftIntakeRequiredClarificationField
        question={sampleQuestion}
        answer=""
        busy={false}
        clarificationIndex={1}
        clarificationTotal={3}
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByTestId("socratic-question-progress")).toHaveTextContent(
      /required clarification 1 of 3/i,
    );
    expect(screen.getByTestId("socratic-question-baseline-label")).toHaveTextContent(
      REQUIRED_CLARIFICATION_BASELINE_LABEL,
    );
    expect(screen.getByRole("button", { name: "Save and continue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Skip this clarification" })).toBeEnabled();
  });

  it("enables save and continue when an answer is present", () => {
    render(
      <DraftIntakeRequiredClarificationField
        question={sampleQuestion}
        answer="Encrypted at rest"
        busy={false}
        clarificationIndex={1}
        clarificationTotal={3}
        canSaveAndContinue
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save and continue" })).toBeEnabled();
  });

  it("marks non-primary questions for secondary styling", () => {
    render(
      <DraftIntakeRequiredClarificationField
        question={sampleQuestion}
        answer=""
        busy={false}
        clarificationIndex={2}
        clarificationTotal={3}
        isPrimary={false}
        compactActions
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByTestId("socratic-question")).toHaveAttribute("data-question-primary", "false");
  });

  it("invokes save and continue handler", () => {
    const onSaveAndContinue = vi.fn();

    render(
      <DraftIntakeRequiredClarificationField
        question={sampleQuestion}
        answer="Encrypted at rest"
        busy={false}
        clarificationIndex={1}
        clarificationTotal={1}
        canSaveAndContinue
        onAnswerChange={vi.fn()}
        onSaveAndContinue={onSaveAndContinue}
        onSkip={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));

    expect(onSaveAndContinue).toHaveBeenCalledWith("l0.pillar.security");
  });

  it("invokes skip handler", () => {
    const onSkip = vi.fn();

    render(
      <DraftIntakeRequiredClarificationField
        question={sampleQuestion}
        answer="Encrypted at rest"
        busy={false}
        clarificationIndex={1}
        clarificationTotal={1}
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={onSkip}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Skip this clarification" }));

    expect(onSkip).toHaveBeenCalledWith("l0.pillar.security");
  });
});

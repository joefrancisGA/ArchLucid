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
  it("shows baseline label and skip-only actions", () => {
    render(
      <DraftIntakeRequiredClarificationField
        question={sampleQuestion}
        answer=""
        busy={false}
        clarificationIndex={1}
        clarificationTotal={3}
        onAnswerChange={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByTestId("socratic-question-progress")).toHaveTextContent(
      /required clarification 1 of 3/i,
    );
    expect(screen.getByTestId("socratic-question-baseline-label")).toHaveTextContent(
      REQUIRED_CLARIFICATION_BASELINE_LABEL,
    );
    expect(screen.queryByRole("button", { name: "Save and continue" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip for now" })).toHaveClass("hover:bg-neutral-100");
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
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByTestId("socratic-question")).toHaveAttribute("data-question-primary", "false");
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
        onSkip={onSkip}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(onSkip).toHaveBeenCalledWith("l0.pillar.security");
  });
});

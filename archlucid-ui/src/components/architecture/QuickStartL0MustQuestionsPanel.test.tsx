import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuickStartL0MustQuestionsPanel } from "@/components/architecture/QuickStartL0MustQuestionsPanel";
import { UNIVERSAL_INTAKE_SUGGEST_FROM_EVIDENCE_LABEL } from "@/lib/universal-intake-answer-inference";

describe("QuickStartL0MustQuestionsPanel", () => {
  it("shows suggest-from-evidence control when evidence or context is available", () => {
    const onSuggestFromEvidence = vi.fn();

    render(
      <QuickStartL0MustQuestionsPanel
        answers={{}}
        skippedQuestionKeys={new Set()}
        canSuggestFromEvidence
        onSuggestFromEvidence={onSuggestFromEvidence}
        busy={false}
        onAnswersChange={vi.fn()}
        onSkippedQuestionKeysChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("first-pilot-l0-suggest-from-evidence")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("first-pilot-suggest-from-evidence"));
    expect(onSuggestFromEvidence).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: UNIVERSAL_INTAKE_SUGGEST_FROM_EVIDENCE_LABEL })).toBeInTheDocument();
  });

  it("hides suggest-from-evidence control until evidence or context is available", () => {
    render(
      <QuickStartL0MustQuestionsPanel
        answers={{}}
        skippedQuestionKeys={new Set()}
        canSuggestFromEvidence={false}
        busy={false}
        onAnswersChange={vi.fn()}
        onSkippedQuestionKeysChange={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("first-pilot-l0-suggest-from-evidence")).not.toBeInTheDocument();
  });
});

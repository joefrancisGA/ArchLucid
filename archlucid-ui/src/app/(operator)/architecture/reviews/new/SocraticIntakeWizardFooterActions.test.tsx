import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GUIDED_INTAKE_REVIEW_ANSWERS_DISABLED_HINT } from "@/lib/guided-intake-copy";

import { SocraticIntakeWizardFooterActions } from "./SocraticIntakeWizardFooterActions";

describe("SocraticIntakeWizardFooterActions", () => {
  it("disables continue until clarifications can be reviewed and routes zero-pending advance", () => {
    const onReviewAnswers = vi.fn();
    const onAdvanceToConfirm = vi.fn();

    const { rerender } = render(
      <SocraticIntakeWizardFooterActions
        handledClarificationCount={0}
        totalRequiredClarifications={2}
        allClarificationsHandled={false}
        canReviewAnswers={false}
        busy={false}
        isSubmitBlocked={false}
        pendingQuestionCount={2}
        onReviewAnswers={onReviewAnswers}
        onAdvanceToConfirm={onAdvanceToConfirm}
      />,
    );

    expect(screen.getByTestId("socratic-review-answers-hint")).toHaveTextContent(
      GUIDED_INTAKE_REVIEW_ANSWERS_DISABLED_HINT,
    );
    expect(screen.getByTestId("socratic-questions-done")).toBeDisabled();

    rerender(
      <SocraticIntakeWizardFooterActions
        handledClarificationCount={2}
        totalRequiredClarifications={2}
        allClarificationsHandled
        canReviewAnswers
        busy={false}
        isSubmitBlocked={false}
        pendingQuestionCount={0}
        onReviewAnswers={onReviewAnswers}
        onAdvanceToConfirm={onAdvanceToConfirm}
      />,
    );

    fireEvent.click(screen.getByTestId("socratic-questions-done"));

    expect(onAdvanceToConfirm).toHaveBeenCalledTimes(1);
    expect(onReviewAnswers).not.toHaveBeenCalled();
  });
});

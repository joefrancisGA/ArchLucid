import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DraftIntakeRequiredClarificationField } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ mode: "operator" }),
}));

const question: DraftElicitationQuestion = {
  questionKey: "unknown-key",
  prompt: "Describe the data boundary.",
  tier: "Must",
  answerType: "FreeText",
};

describe("DraftIntakeRequiredClarificationField (P-15)", () => {
  it("does not show clarification 0 of N when ordinal is missing", () => {
    render(
      <DraftIntakeRequiredClarificationField
        question={question}
        answer=""
        busy={false}
        clarificationIndex={null}
        clarificationTotal={3}
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByTestId("socratic-question-progress")).toHaveTextContent(
      "Clarification order was not stored.",
    );
    expect(screen.queryByText(/Required clarification 0 of/)).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClarificationAnswerCapturePanel } from "@/components/architecture/ClarificationAnswerCapturePanel";
import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";

vi.mock("@/lib/api/knowledge-model-clarification-api", () => ({
  applyKnowledgeModelClarificationAnswers: vi.fn(),
}));

const sampleQuestion: ReviewClarificationQuestion = {
  questionId: "q-1",
  prompt: "Who owns retention?",
  sourceFindingId: "finding-1",
  sourceFindingType: "ClarificationGap",
  severity: "Info",
  missingItem: "retention-owner",
};

describe("ClarificationAnswerCapturePanel", () => {
  it("labels missing derived question count as not stored", () => {
    render(
      <ClarificationAnswerCapturePanel
        runId="run-1"
        priorRunId="prior-1"
        questions={[sampleQuestion]}
        totalDerivedCount={null}
        freeTextIntent=""
      />,
    );

    expect(screen.getByText(/Derived question count was not stored\./)).toBeInTheDocument();
  });
});

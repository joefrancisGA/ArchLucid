import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ClosedLoopReasoningResult } from "./architecture-intelligence-types";
import { ArchitectureIntelligenceReasoningResults } from "./ArchitectureIntelligenceReasoningResults";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    "data-testid"?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function minimalResult(overrides: Partial<ClosedLoopReasoningResult> = {}): ClosedLoopReasoningResult {
  return {
    model: { elements: [] },
    specialistReviews: [],
    recommendations: [],
    mustNotFailViolations: [],
    ...overrides,
  };
}

describe("ArchitectureIntelligenceReasoningResults", () => {
  it("links adversarial challenges to the verify-hypotheses findings lane when runId is present (TB-2315)", () => {
    const result = minimalResult({
      runId: "run-adv",
      adversarial: {
        challenges: [{ hypothesis: "Backup may fail", falsificationEvidenceNeeded: "DR test logs" }],
      },
    });

    render(
      <ArchitectureIntelligenceReasoningResults
        result={result}
        findings={[]}
        interviewQuestions={[]}
        interviewAnswers={{}}
        onInterviewAnswerChange={vi.fn()}
        onResubmitAnswers={vi.fn()}
        isBusy={false}
      />,
    );

    const link = screen.getByTestId("architecture-intelligence-adversarial-verify-lane-link");
    expect(link).toHaveAttribute(
      "href",
      "/architecture/reviews/run-adv?reviewTab=findings&findingJobView=verify-hypotheses",
    );
  });

  it("omits verify-hypotheses lane link when adversarial challenges are absent", () => {
    const result = minimalResult({ runId: "run-adv", adversarial: { challenges: [] } });

    render(
      <ArchitectureIntelligenceReasoningResults
        result={result}
        findings={[]}
        interviewQuestions={[]}
        interviewAnswers={{}}
        onInterviewAnswerChange={vi.fn()}
        onResubmitAnswers={vi.fn()}
        isBusy={false}
      />,
    );

    expect(screen.queryByTestId("architecture-intelligence-adversarial-verify-lane-link")).not.toBeInTheDocument();
  });
});

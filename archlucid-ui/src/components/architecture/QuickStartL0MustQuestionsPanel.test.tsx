import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuickStartL0MustQuestionsPanel } from "@/components/architecture/QuickStartL0MustQuestionsPanel";
import { GUIDED_INTAKE_CLARIFICATION_SAVED_ON_PAGE_NOT_SUBMITTED } from "@/lib/guided-intake-copy";
import { UNIVERSAL_INTAKE_SUGGEST_FROM_EVIDENCE_LABEL } from "@/lib/universal-intake-answer-inference";

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

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

  it("labels locally saved answers as saved on page not submitted", () => {
    const source = readSrc("src/components/architecture/QuickStartL0MustQuestionsPanel.tsx");

    expect(source).toContain("GUIDED_INTAKE_CLARIFICATION_SAVED_ON_PAGE_NOT_SUBMITTED");
    expect(source).not.toMatch(/label:\s*"Answered"/);
    expect(GUIDED_INTAKE_CLARIFICATION_SAVED_ON_PAGE_NOT_SUBMITTED).toBe("Saved on page — not submitted");
  });
});

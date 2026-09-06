import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CLOUD_TARGET_QUESTION_KEY,
  DraftIntakeRequiredClarificationField,
} from "./DraftIntakeRequiredClarificationField";
import {
  GUIDED_INTAKE_SAVE_AND_CONTINUE_LABEL,
  GUIDED_INTAKE_SAVE_ANSWER_LABEL,
} from "@/lib/guided-intake-copy";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: false }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

const sampleQuestion = {
  questionKey: "l0.pillar.security",
  prompt: "How is data protected?",
  tier: "Must" as const,
  answerKind: "FreeText" as const,
  source: "L0Universal" as const,
  ruleKeys: [],
};

describe("DraftIntakeRequiredClarificationField", () => {
  it("shows engine measurement hint in Working mode when the answer is empty (PC-02)", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <DraftIntakeRequiredClarificationField
        question={{
          questionKey: "l0.actor.additional-kinds",
          prompt: "Are there other kinds of users?",
          tier: "Must",
          answerKind: "Text",
          source: "L0Universal",
          ruleKeys: [],
        }}
        answer=""
        busy={false}
        clarificationIndex={1}
        clarificationTotal={8}
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByTestId("socratic-question-measurement-engine-hint")).toHaveTextContent(
      /trust-boundary/i,
    );
  });

  it("shows save-and-continue outline action and skip link", () => {
    workspaceModeMock.isWorkingMode = false;
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
    expect(screen.getByRole("button", { name: GUIDED_INTAKE_SAVE_AND_CONTINUE_LABEL })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Skip this clarification" })).toBeEnabled();
  });

  it("uses Save answer label in show-all mode", () => {
    render(
      <DraftIntakeRequiredClarificationField
        question={sampleQuestion}
        answer="Encrypted at rest"
        busy={false}
        clarificationIndex={1}
        clarificationTotal={3}
        showAllMode
        canSaveAndContinue
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: GUIDED_INTAKE_SAVE_ANSWER_LABEL })).toBeEnabled();
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

    expect(screen.getByRole("button", { name: GUIDED_INTAKE_SAVE_AND_CONTINUE_LABEL })).toBeEnabled();
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

  it("renders clarification status tag when provided", () => {
    render(
      <DraftIntakeRequiredClarificationField
        question={sampleQuestion}
        answer=""
        busy={false}
        clarificationIndex={1}
        clarificationTotal={3}
        clarificationStatus={{ kind: "needs-attention", label: "Needs answer" }}
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByTestId("socratic-question-status")).toHaveTextContent("Needs answer");
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

    fireEvent.click(screen.getByRole("button", { name: GUIDED_INTAKE_SAVE_AND_CONTINUE_LABEL }));

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

  it("renders cloud target question as a select with control-type hint", () => {
    const cloudTargetQuestion = {
      ...sampleQuestion,
      questionKey: CLOUD_TARGET_QUESTION_KEY,
      prompt: "Which cloud provider is this architecture targeting — or is it intentionally cloud-neutral?",
      answerKind: "Enum" as const,
    };

    render(
      <DraftIntakeRequiredClarificationField
        question={cloudTargetQuestion}
        answer=""
        busy={false}
        clarificationIndex={1}
        clarificationTotal={7}
        onAnswerChange={vi.fn()}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("socratic-cloud-target-select")).toBeInTheDocument();
    expect(screen.getByTestId("socratic-cloud-target-control-hint")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /which cloud provider/i })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("socratic-cloud-target-select"));

    expect(screen.getByTestId("socratic-cloud-target-option-Azure")).toBeInTheDocument();
    expect(screen.getByTestId("socratic-cloud-target-option-Aws")).toBeInTheDocument();
    expect(screen.getByTestId("socratic-cloud-target-option-Gcp")).toBeInTheDocument();
    expect(screen.getByTestId("socratic-cloud-target-option-None")).toBeInTheDocument();
  });

  it("invokes onAnswerChange with enum name when cloud target option is selected", () => {
    const onAnswerChange = vi.fn();
    const cloudTargetQuestion = {
      ...sampleQuestion,
      questionKey: CLOUD_TARGET_QUESTION_KEY,
      prompt: "Which cloud provider is this architecture targeting — or is it intentionally cloud-neutral?",
      answerKind: "Enum" as const,
    };

    render(
      <DraftIntakeRequiredClarificationField
        question={cloudTargetQuestion}
        answer=""
        busy={false}
        clarificationIndex={1}
        clarificationTotal={7}
        onAnswerChange={onAnswerChange}
        onSaveAndContinue={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("socratic-cloud-target-select"));
    fireEvent.click(screen.getByTestId("socratic-cloud-target-option-Azure"));

    expect(onAnswerChange).toHaveBeenCalledWith(CLOUD_TARGET_QUESTION_KEY, "Azure");
  });
});

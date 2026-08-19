import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const branchDraftRequest = vi.fn();
const getDraftBranchQuota = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  branchDraftRequest: (...args: unknown[]) => branchDraftRequest(...args),
  getDraftBranchQuota: (...args: unknown[]) => getDraftBranchQuota(...args),
}));

import { DraftIntakeWhatIfBranchPanel } from "./DraftIntakeWhatIfBranchPanel";

describe("DraftIntakeWhatIfBranchPanel", () => {
  it("posts a branch request and notifies the parent", async () => {
    const onBranched = vi.fn();

    getDraftBranchQuota.mockResolvedValue({
      draftId: "parent-1",
      existingBranchCount: 0,
      maxBranchesPerParent: 3,
      remainingBranches: 3,
      canBranch: true,
      estimatedBranchRunCostUsd: 1,
    });

    branchDraftRequest.mockResolvedValue({
      parentDraftId: "parent-1",
      branch: {
        draftId: "branch-1",
        document: {
          freeTextIntent: "Relaxed latency target.",
          businessOutcome: "Reduce triage time.",
          actorSet: { actors: [] },
        },
      },
    });

    render(
      <DraftIntakeWhatIfBranchPanel
        draftId="parent-1"
        intent="Keep latency under three seconds."
        outcome="Reduce triage time."
        systemName="Claims intake"
        questionOptions={[
          {
            questionKey: "l0.pillar.security",
            prompt: "How is data protected?",
            tier: "Must",
            answerKind: "FreeText",
            source: "L0Universal",
            ruleKeys: [],
          },
        ]}
        onBranched={onBranched}
      />,
    );

    fireEvent.change(screen.getByTestId("draft-intake-what-if-value"), {
      target: { value: "Allow five second sync latency for batch exports." },
    });
    fireEvent.click(screen.getByTestId("draft-intake-what-if-submit"));

    await waitFor(() => {
      expect(branchDraftRequest).toHaveBeenCalledWith("parent-1", {
        overrideKind: "QuestionAnswer",
        overrideKey: "l0.pillar.security",
        overrideValue: "Allow five second sync latency for batch exports.",
      });
    });

    expect(onBranched).toHaveBeenCalled();
    expect(screen.getByTestId("draft-intake-what-if-quota")).toHaveTextContent(/branches used: 0\/3/i);
  });

  it("disables branch submit when quota is exhausted", async () => {
    getDraftBranchQuota.mockResolvedValue({
      draftId: "parent-1",
      existingBranchCount: 3,
      maxBranchesPerParent: 3,
      remainingBranches: 0,
      canBranch: false,
      estimatedBranchRunCostUsd: 1,
    });

    render(
      <DraftIntakeWhatIfBranchPanel
        draftId="parent-1"
        intent="Intent"
        outcome="Outcome"
        systemName=""
        questionOptions={[]}
        onBranched={vi.fn()}
      />,
    );

    await screen.findByText(/branch cap reached/i);

    expect(screen.getByTestId("draft-intake-what-if-submit")).toBeDisabled();
  });

  it("defaults to business outcome override when clarification answer override is suppressed", async () => {
    getDraftBranchQuota.mockResolvedValue({
      draftId: "parent-1",
      existingBranchCount: 0,
      maxBranchesPerParent: 3,
      remainingBranches: 3,
      canBranch: true,
      estimatedBranchRunCostUsd: 1,
    });

    render(
      <DraftIntakeWhatIfBranchPanel
        draftId="parent-1"
        intent="Keep latency under three seconds."
        outcome="Reduce triage time."
        systemName="Claims intake"
        questionOptions={[
          {
            questionKey: "l0.pillar.security",
            prompt: "How is data protected?",
            tier: "Must",
            answerKind: "FreeText",
            source: "L0Universal",
            ruleKeys: [],
          },
        ]}
        suppressQuestionAnswerOverride
        onBranched={vi.fn()}
      />,
    );

    await screen.findByTestId("draft-intake-what-if-kind");

    expect(screen.queryByTestId("draft-intake-what-if-question")).not.toBeInTheDocument();
    expect(screen.getByTestId("draft-intake-what-if-value")).toHaveValue("Reduce triage time.");
  });
});

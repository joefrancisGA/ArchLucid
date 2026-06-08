import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const branchDraftRequest = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  branchDraftRequest: (...args: unknown[]) => branchDraftRequest(...args),
}));

import { DraftIntakeWhatIfBranchPanel } from "./DraftIntakeWhatIfBranchPanel";

describe("DraftIntakeWhatIfBranchPanel", () => {
  it("posts a branch request and notifies the parent", async () => {
    const onBranched = vi.fn();

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
        defaultOpen
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
  });
});

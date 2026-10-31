import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OPERATOR_FORM_FIELD_STACK_CLASS } from "@/lib/design-tokens";

// Deliberately return a fresh query snapshot on every render; the picker must
// not mirror referentially unstable query data into a render-triggering state.
const queryMockState = vi.hoisted(() => ({ calls: 0 }));

vi.mock("@/hooks/use-ask-project-runs-query", () => ({
  useAskProjectRunsQuery: () => {
    queryMockState.calls += 1;
    if (queryMockState.calls > 20) {
      throw new Error("AskRunIdPicker query-data render loop");
    }
    return {
      data: {
        items: [{ runId: "run-1", displayName: "", description: "" }],
        loadError: false,
      },
      isLoading: false,
      isError: false,
    };
  },
}));

import { GovernanceWorkflowSubmitSection } from "./GovernanceWorkflowSubmitSection";

function renderSubmitSection(): void {
  render(
    <GovernanceWorkflowSubmitSection
      buyerPolishedShell={false}
      buyerSuppressGovernanceSubmitChrome={false}
      canMutateWorkflow={true}
      hideGovernanceQueryLoadCard={false}
      preferAutoPick={false}
      submitRunId=""
      setSubmitRunId={vi.fn()}
      submitManifestVersion=""
      maxPersistedManifestVersion={null}
      setSubmitManifestVersion={vi.fn()}
      submitSource=""
      setSubmitSource={vi.fn()}
      submitTarget=""
      setSubmitTarget={vi.fn()}
      submitComment=""
      setSubmitComment={vi.fn()}
      submitBusy={false}
      onSubmitApproval={vi.fn()}
    />,
  );
}

describe("GovernanceWorkflowSubmitSection breathing room (TB-2000)", () => {
  beforeEach(() => {
    queryMockState.calls = 0;
  });

  it("does not loop on fresh-but-equivalent project-runs query objects", () => {
    renderSubmitSection();
    expect(queryMockState.calls).toBeLessThan(20);
  });

  it("uses OPERATOR_FORM_FIELD_STACK_CLASS on label-control field stacks", () => {
    renderSubmitSection();

    const versionInput = screen.getByLabelText(/Review record version/i);
    const versionStack = versionInput.parentElement;

    expect(versionStack).not.toBeNull();
    expect(versionStack?.className).toContain(OPERATOR_FORM_FIELD_STACK_CLASS);

    const commentInput = screen.getByLabelText(/Request comment/i);
    const commentStack = commentInput.parentElement;

    expect(commentStack).not.toBeNull();
    expect(commentStack?.className).toContain(OPERATOR_FORM_FIELD_STACK_CLASS);
  });
});

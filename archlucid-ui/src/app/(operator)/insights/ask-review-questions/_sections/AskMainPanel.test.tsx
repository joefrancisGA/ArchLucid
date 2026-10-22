import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AskMainPanel } from "./AskMainPanel";

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("./AskReviewScopeStrip", () => ({
  AskReviewScopeStrip: () => null,
}));

vi.mock("./AskCompareReviewsCollapsible", () => ({
  AskCompareReviewsCollapsible: () => null,
}));

vi.mock("./AskQuestionForm", () => ({
  AskQuestionForm: () => <div data-testid="ask-question-form" />,
}));

vi.mock("./AskMessageThreadPanel", () => ({
  AskMessageThreadPanel: () => <div data-testid="ask-message-thread-panel" />,
}));

describe("AskMainPanel checklist", () => {
  it("renders a three-step ask checklist before the question form", () => {
    render(
      <AskMainPanel
        runId=""
        onRunIdChange={() => undefined}
        selectedThreadId=""
        buyerPolishedShell={false}
        hideCompareChrome
        compareOpen={false}
        onCompareOpenChange={() => undefined}
        baseRunId=""
        onBaseRunIdChange={() => undefined}
        targetRunId=""
        onTargetRunIdChange={() => undefined}
        questionRef={createRef<HTMLTextAreaElement>()}
        question=""
        onQuestionChange={() => undefined}
        showRunDeepLinkPrompts={false}
        runAnchorUnset
        onMergePromptLine={() => undefined}
        loading={false}
        askDisabled
        onAsk={vi.fn()}
        actionFailure={null}
        messages={[]}
        streamingAssistantContent={null}
        askAssistantGroundingLinks={null}
        askCitationActionFollowUps={[]}
        showPostAssistantFollowUps={false}
      />,
    );

    expect(screen.getByTestId("ask-question-setup-progress")).toBeInTheDocument();
    expect(screen.getByTestId("ask-question-setup-step-review")).toHaveAttribute("data-emphasized", "true");
    expect(screen.getByTestId("ask-question-form")).toBeInTheDocument();
  });
});

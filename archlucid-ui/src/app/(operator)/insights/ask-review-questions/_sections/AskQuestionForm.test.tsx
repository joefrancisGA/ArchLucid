import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AskQuestionForm } from "@/app/(operator)/insights/ask-review-questions/_sections/AskQuestionForm";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("AskQuestionForm", () => {
  it("shows workspace scope helper when no review anchor is selected", () => {
    render(
      <AskQuestionForm
        questionRef={{ current: null }}
        question="What patterns repeat?"
        onQuestionChange={() => undefined}
        buyerPolishedShell={false}
        showRunDeepLinkPrompts={false}
        runAnchorUnset
        onMergePromptLine={() => undefined}
        loading={false}
        askDisabled={false}
        onAsk={() => undefined}
      />,
    );

    expect(screen.getByTestId("ask-workspace-scope-helper")).toHaveTextContent(
      "Searching all reviews in this workspace",
    );
    expect(screen.queryByTestId("ask-prompts-sample-callout")).not.toBeInTheDocument();
  });

  it("routes buyer-polished users to the sample workspace callout when workspace-scoped", () => {
    render(
      <AskQuestionForm
        questionRef={{ current: null }}
        question=""
        onQuestionChange={() => undefined}
        buyerPolishedShell
        showRunDeepLinkPrompts={false}
        runAnchorUnset
        onMergePromptLine={() => undefined}
        loading={false}
        askDisabled={false}
        onAsk={() => undefined}
      />,
    );

    expect(screen.getByTestId("ask-prompts-sample-callout")).toHaveTextContent("not your tenant workspace");
    expect(screen.getByRole("link", { name: "Claims Intake sample graph" })).toHaveAttribute(
      "href",
      `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    );
  });
});

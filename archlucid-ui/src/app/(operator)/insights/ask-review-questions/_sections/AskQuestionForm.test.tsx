import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AskQuestionForm } from "@/app/(operator)/ask/_sections/AskQuestionForm";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("AskQuestionForm", () => {
  it("explains why asking is blocked and routes to the sample workspace when no review is selected", () => {
    render(
      <AskQuestionForm
        questionRef={{ current: null }}
        question=""
        onQuestionChange={() => undefined}
        buyerPolishedShell={false}
        showRunDeepLinkPrompts={false}
        runMissing
        onMergePromptLine={() => undefined}
        loading={false}
        askDisabled
        onAsk={() => undefined}
      />,
    );

    expect(screen.getByTestId("ask-select-review-helper")).toHaveTextContent("Select a review first.");
    expect(screen.getByTestId("ask-prompts-sample-callout")).toHaveTextContent("Claims Intake sample graph");
    expect(screen.getByTestId("ask-prompts-sample-callout")).toHaveTextContent("not your tenant workspace");
    expect(screen.getByRole("link", { name: "Claims Intake sample graph" })).toHaveAttribute(
      "href",
      `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    );
  });
});

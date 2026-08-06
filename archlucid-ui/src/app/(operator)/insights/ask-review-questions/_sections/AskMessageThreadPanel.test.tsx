import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AskMessageThreadPanel } from "@/app/(operator)/insights/ask-review-questions/_sections/AskMessageThreadPanel";

vi.mock("@/components/AskAssistantMessageBody", () => ({
  AskAssistantMessageBody: ({ content }: { content: string }) => <p>{content}</p>,
}));

describe("AskMessageThreadPanel", () => {
  it("shows finalized review artifact status", () => {
    render(
      <AskMessageThreadPanel
        buyerPolishedShell
        messages={[]}
        streamingAssistantContent={null}
        askAssistantGroundingLinks={[]}
        showPostAssistantFollowUps={false}
        runMissing={false}
        onMergePromptLine={() => {}}
        isFinalizedReview
      />,
    );

    expect(screen.getByTestId("ask-review-artifact-status")).toHaveTextContent(/finalized architecture review/i);
  });

  it("marks uncited assistant output", () => {
    render(
      <AskMessageThreadPanel
        buyerPolishedShell
        messages={[
          {
            messageId: "m1",
            role: "Assistant",
            content: "Answer without citations",
            createdUtc: "2026-01-01T00:00:00.000Z",
          },
        ]}
        streamingAssistantContent={null}
        askAssistantGroundingLinks={[]}
        showPostAssistantFollowUps={false}
        runMissing={false}
        onMergePromptLine={() => {}}
      />,
    );

    expect(screen.getByTestId("ask-uncited-assistant-marker")).toHaveTextContent(/No cited findings linked/i);
  });

  it("shows streaming provisional marker", () => {
    render(
      <AskMessageThreadPanel
        buyerPolishedShell
        messages={[]}
        streamingAssistantContent="Partial answer"
        askAssistantGroundingLinks={[]}
        showPostAssistantFollowUps={false}
        runMissing={false}
        onMergePromptLine={() => {}}
      />,
    );

    expect(screen.getByTestId("ask-streaming-provisional-marker")).toHaveTextContent(/Provisional answer/i);
  });
});

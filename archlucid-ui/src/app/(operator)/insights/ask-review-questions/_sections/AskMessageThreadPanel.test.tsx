import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AskMessageThreadPanel } from "@/app/(operator)/insights/ask-review-questions/_sections/AskMessageThreadPanel";

vi.mock("@/components/AskAssistantMessageBody", () => ({
  AskAssistantMessageBody: ({ content }: { content: string }) => <p>{content}</p>,
}));

const baseProps = {
  buyerPolishedShell: true,
  streamingAssistantContent: null as string | null,
  askAssistantGroundingLinks: [] as const,
  askCitationActionFollowUps: [] as const,
  showPostAssistantFollowUps: false,
  runAnchorUnset: false,
  onMergePromptLine: () => {},
};

describe("AskMessageThreadPanel", () => {
  it("shows finalized review artifact status", () => {
    render(
      <AskMessageThreadPanel
        {...baseProps}
        messages={[]}
        isFinalizedReview
      />,
    );

    expect(screen.getByTestId("ask-review-artifact-status")).toHaveTextContent(/finalized architecture review/i);
  });

  it("marks uncited assistant output", () => {
    render(
      <AskMessageThreadPanel
        {...baseProps}
        messages={[
          {
            messageId: "m1",
            threadId: "t1",
            role: "Assistant",
            content: "Answer without citations",
            createdUtc: "2026-01-01T00:00:00.000Z",
            metadataJson: "{}",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("ask-uncited-assistant-marker")).toHaveTextContent(/No cited findings linked/i);
  });

  it("shows streaming provisional marker", () => {
    render(
      <AskMessageThreadPanel
        {...baseProps}
        messages={[]}
        streamingAssistantContent="Partial answer"
      />,
    );

    expect(screen.getByTestId("ask-streaming-provisional-marker")).toHaveTextContent(/Provisional answer/i);
  });

  it("mounts citation action follow-ups after the latest assistant answer", () => {
    render(
      <AskMessageThreadPanel
        {...baseProps}
        showPostAssistantFollowUps
        askCitationActionFollowUps={[
          {
            kind: "finding",
            label: "Open finding",
            href: "/architecture/reviews/run-a/findings/f-1",
            citationId: "f-1",
          },
        ]}
        messages={[
          {
            messageId: "m1",
            threadId: "t1",
            role: "Assistant",
            content: "Cited answer",
            createdUtc: "2026-01-01T00:00:00.000Z",
            metadataJson: "{}",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("ask-citation-action-follow-ups")).toBeInTheDocument();
    expect(screen.getByTestId("ask-citation-action-finding")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-a/findings/f-1",
    );
    expect(screen.getByTestId("ask-canned-prompt-follow-ups")).toBeInTheDocument();
  });

  it("shows honest empty citation follow-ups when no actionable ids", () => {
    render(
      <AskMessageThreadPanel
        {...baseProps}
        showPostAssistantFollowUps
        askCitationActionFollowUps={[]}
        messages={[
          {
            messageId: "m1",
            threadId: "t1",
            role: "Assistant",
            content: "Answer without actionable citations",
            createdUtc: "2026-01-01T00:00:00.000Z",
            metadataJson: "{}",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("ask-citation-action-follow-ups")).toHaveTextContent(
      /No linked finding, evidence, or decision/i,
    );
  });
});

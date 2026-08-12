import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestPreviewBeforeSubscribePanel } from "@/components/digests/DigestPreviewBeforeSubscribePanel";
import {
  DIGEST_PREVIEW_BEFORE_SUBSCRIBE_TITLE,
  DIGEST_PREVIEW_SEND_TO_ME_LABEL,
  DIGEST_PREVIEW_SEND_TO_ME_UNAVAILABLE_REASON,
} from "@/lib/digest-preview-before-subscribe";

describe("DigestPreviewBeforeSubscribePanel (TB-2211)", () => {
  it("renders architecture subscription specimen from form values", () => {
    render(
      <DigestPreviewBeforeSubscribePanel
        variant="architecture-subscription"
        subscriptionName="Ops mailbox"
        channelType="Email"
        destination="ops@example.com"
        digestTypeLabel="Architecture digest"
      />,
    );

    expect(screen.getByTestId("digest-preview-before-subscribe")).toBeInTheDocument();
    expect(screen.getByText(DIGEST_PREVIEW_BEFORE_SUBSCRIBE_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("digest-preview-before-subscribe-subject")).toHaveTextContent("Ops mailbox");
    expect(screen.getByTestId("digest-preview-before-subscribe-to")).toHaveTextContent("ops@example.com");
    expect(screen.getByTestId("digest-preview-before-subscribe-sections")).toBeInTheDocument();
    expect(screen.getByText("Review activity")).toBeInTheDocument();
  });

  it("disables send-to-me with an honest unavailable reason", () => {
    render(
      <DigestPreviewBeforeSubscribePanel
        variant="architecture-subscription"
        channelType="Email"
        destination="ops@example.com"
      />,
    );

    const sendButton = screen.getByTestId("digest-preview-before-subscribe-send-to-me");

    expect(sendButton).toBeDisabled();
    expect(sendButton).toHaveAttribute(
      "aria-describedby",
      "digest-preview-before-subscribe-send-to-me-reason",
    );
    expect(sendButton).not.toHaveAttribute("title");
    expect(sendButton).toHaveTextContent(DIGEST_PREVIEW_SEND_TO_ME_LABEL);
    expect(screen.getByTestId("digest-preview-before-subscribe-send-to-me-reason")).toHaveTextContent(
      DIGEST_PREVIEW_SEND_TO_ME_UNAVAILABLE_REASON,
    );
  });

  it("renders executive schedule specimen with cadence and recipients", () => {
    render(
      <DigestPreviewBeforeSubscribePanel
        variant="executive-schedule"
        recipientEmails={["sponsor@example.com"]}
        cadenceSummary="Every Monday at 8:00 AM Eastern"
      />,
    );

    expect(screen.getByTestId("digest-preview-before-subscribe-to")).toHaveTextContent("sponsor@example.com");
    expect(screen.getByTestId("digest-preview-before-subscribe-meta")).toHaveTextContent(
      "Every Monday at 8:00 AM Eastern",
    );
    expect(screen.getByText(/Architecture and review activity summary/i)).toBeInTheDocument();
  });
});
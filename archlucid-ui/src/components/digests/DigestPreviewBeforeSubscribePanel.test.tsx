import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestPreviewBeforeSubscribePanel } from "@/components/digests/DigestPreviewBeforeSubscribePanel";
import { DIGEST_PREVIEW_BEFORE_SUBSCRIBE_TITLE } from "@/lib/digest-preview-before-subscribe";

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
    expect(screen.getByTestId("digest-preview-before-subscribe-subject")).toHaveTextContent("Architecture digest");
    expect(screen.getByTestId("digest-preview-before-subscribe-to")).toHaveTextContent("ops@example.com");
    expect(screen.getByTestId("digest-preview-before-subscribe-sections")).toBeInTheDocument();
    expect(screen.getByText("Review activity")).toBeInTheDocument();
  });

  it("does not render send-to-me controls", () => {
    render(
      <DigestPreviewBeforeSubscribePanel
        variant="architecture-subscription"
        channelType="Email"
        destination="ops@example.com"
      />,
    );

    expect(screen.queryByTestId("digest-preview-before-subscribe-send-to-me")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-preview-before-subscribe-send-to-me-reason")).not.toBeInTheDocument();
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

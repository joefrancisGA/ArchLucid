import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhySecureNowDraftView } from "@/app/(marketing)/why-securenow/WhySecureNowDraftView";
import { metadata } from "@/app/(marketing)/why-securenow/page";
import {
  WHY_SECURENOW_CONVERSATION_LABEL,
  WHY_SECURENOW_DRAFT_PITCH,
  WHY_SECURENOW_PILOT_DECISION_BODY,
  WHY_SECURENOW_REVIEWER_PACK_BODY,
  WHY_SECURENOW_STATUS_LINE,
} from "@/lib/marketing/why-securenow-draft-copy";

describe("Why SecureNow page (SN-MKT-02 / SN-MKT-08)", () => {
  it("renders the status line, pitch, and conversation link", () => {
    render(<WhySecureNowDraftView />);

    expect(screen.getByTestId("why-securenow-draft-banner")).toHaveTextContent(WHY_SECURENOW_STATUS_LINE);
    expect(screen.getByTestId("why-securenow-draft-pitch")).toHaveTextContent(WHY_SECURENOW_DRAFT_PITCH);
    expect(screen.getByRole("link", { name: WHY_SECURENOW_CONVERSATION_LABEL })).toHaveAttribute(
      "href",
      "mailto:support@archlucid.net?subject=SecureNow%20conversation",
    );
  });

  it("does not show the old internal draft banner", () => {
    render(<WhySecureNowDraftView />);

    expect(screen.queryByText(/Internal draft\. Not approved buyer communication\./)).not.toBeInTheDocument();
  });

  it("avoids forbidden commercial and certification wording in rendered copy", () => {
    const { container } = render(<WhySecureNowDraftView />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/\$/);
    expect(text).not.toMatch(/\bguaranteed\b/i);
    expect(text).not.toMatch(/\bautonomous\b/i);
    expect(text).not.toMatch(/SOC 2/i);
    expect(text).not.toMatch(/\bcertified\b/i);
  });

  it("exports indexable metadata", () => {
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.description).toBe(WHY_SECURENOW_DRAFT_PITCH);
  });

  it("renders the reviewer-pack anchor before the conversation link", () => {
    render(<WhySecureNowDraftView />);

    const reviewerSection = document.getElementById("reviewer-pack");
    expect(reviewerSection).not.toBeNull();
    expect(reviewerSection).toHaveTextContent(WHY_SECURENOW_REVIEWER_PACK_BODY);
  });

  it("renders the pilot decision anchor with the three human outcomes", () => {
    render(<WhySecureNowDraftView />);

    const decisionSection = document.getElementById("pilot-decision");
    expect(decisionSection).not.toBeNull();
    expect(decisionSection).toHaveTextContent(WHY_SECURENOW_PILOT_DECISION_BODY);
    expect(decisionSection).toHaveTextContent(/proceed to commercial discussion/i);
    expect(decisionSection).toHaveTextContent(/extend with bounded scope/i);
    expect(decisionSection).toHaveTextContent(/\bstop\b/i);
  });
});

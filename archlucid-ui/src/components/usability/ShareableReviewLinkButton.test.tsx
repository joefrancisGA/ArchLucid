import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { SHARE_LINK_PERMISSION_CLARITY_TITLE } from "@/lib/share-link-permission-clarity";

describe("ShareableReviewLinkButton (TB-2212)", () => {
  it("does not render when the review is not committed", () => {
    const { container } = render(<ShareableReviewLinkButton runId="run-1" isCommitted={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows blocked reason when committed without sealed manifest version", () => {
    render(<ShareableReviewLinkButton runId="run-claims" isCommitted />);

    expect(screen.getByTestId("shareable-review-link-blocked-reason")).toBeInTheDocument();
    expect(screen.queryByTestId("shareable-review-link-trigger")).not.toBeInTheDocument();
  });

  it("mounts permission clarity in the create disclosure before copy", () => {
    render(<ShareableReviewLinkButton runId="run-claims" isCommitted manifestVersion="manifest-v1" />);

    fireEvent.click(screen.getByTestId("shareable-review-link-trigger"));

    expect(screen.getByTestId("share-link-permission-clarity")).toBeInTheDocument();
    expect(screen.getByText(SHARE_LINK_PERMISSION_CLARITY_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("share-link-permission-clarity-whoCanOpen")).toBeInTheDocument();
    expect(screen.getByTestId("share-link-permission-clarity-expires")).toBeInTheDocument();
    expect(screen.getByTestId("share-link-permission-clarity-canExport")).toBeInTheDocument();
    expect(screen.getByTestId("share-link-permission-clarity-vsInvite")).toBeInTheDocument();
    expect(screen.getByText(/showcase\/run-claims/i)).toBeInTheDocument();
  });
});

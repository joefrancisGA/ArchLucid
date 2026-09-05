import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/usability/ShareableReviewLinkButton", () => ({
  ShareableReviewLinkButton: () => <div data-testid="shareable-review-link-button" />,
}));

import { ReviewHeaderShareMenu } from "./ReviewHeaderShareMenu";

describe("ReviewHeaderShareMenu", () => {
  it("renders an enabled share menu trigger when the review pipeline is complete", () => {
    render(
      <ReviewHeaderShareMenu
        runId="run-1"
        isCommitted={false}
        findingsQueueHref="/governance/findings?runId=run-1"
      />,
    );

    const trigger = screen.getByTestId("review-header-share-menu-trigger");
    expect(trigger).toBeEnabled();

    fireEvent.click(trigger);

    expect(screen.getByTestId("review-header-share-menu-links")).toBeInTheDocument();
  });

  it("renders a disabled share menu trigger when the review pipeline is incomplete", () => {
    render(
      <ReviewHeaderShareMenu
        runId="run-1"
        isCommitted={false}
        findingsQueueHref="/governance/findings?runId=run-1"
        disabled
        disabledReason={{
          kind: "lifecycle",
          message: "Unavailable until the review completes. Resolve the execution failure and re-run the review.",
        }}
      />,
    );

    const trigger = screen.getByTestId("review-header-share-menu-trigger");
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute(
      "aria-label",
      "Unavailable until the review completes. Resolve the execution failure and re-run the review.",
    );

    fireEvent.click(trigger);

    expect(screen.queryByTestId("review-header-share-menu-links")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewStartUnresolvedNotice } from "@/components/review-intake/ReviewStartUnresolvedNotice";
import {
  REVIEW_START_UNRESOLVED_MESSAGE,
  REVIEW_START_UNRESOLVED_RECHECK_CTA,
  REVIEW_START_UNRESOLVED_RECHECK_PENDING_LABEL,
} from "@/lib/review-start-progress-copy";

describe("ReviewStartUnresolvedNotice", () => {
  it("announces as status rather than an error, and warns against resubmitting", () => {
    render(<ReviewStartUnresolvedNotice onRecheck={vi.fn()} isRechecking={false} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText(REVIEW_START_UNRESOLVED_MESSAGE)).toBeInTheDocument();
  });

  it("offers an idempotent recheck and a link to the Reviews hub", () => {
    const onRecheck = vi.fn();
    render(<ReviewStartUnresolvedNotice onRecheck={onRecheck} isRechecking={false} />);

    fireEvent.click(screen.getByRole("button", { name: REVIEW_START_UNRESOLVED_RECHECK_CTA }));

    expect(onRecheck).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("review-start-unresolved-open-reviews")).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
  });

  it("disables the recheck control while a recheck is in flight", () => {
    render(<ReviewStartUnresolvedNotice onRecheck={vi.fn()} isRechecking />);

    const button = screen.getByRole("button", {
      name: REVIEW_START_UNRESOLVED_RECHECK_PENDING_LABEL,
    });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("shows a correlation id when one is available, and omits the row when it is not", () => {
    const { rerender } = render(
      <ReviewStartUnresolvedNotice onRecheck={vi.fn()} isRechecking={false} correlationId="corr-123" />,
    );

    expect(screen.getByTestId("review-start-unresolved-correlation-id")).toHaveTextContent("corr-123");

    rerender(<ReviewStartUnresolvedNotice onRecheck={vi.fn()} isRechecking={false} correlationId={null} />);

    expect(screen.queryByTestId("review-start-unresolved-correlation-id")).toBeNull();
  });
});

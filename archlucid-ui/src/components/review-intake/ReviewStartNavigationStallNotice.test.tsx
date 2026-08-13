import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import {
  REVIEW_START_NAVIGATION_STALL_MESSAGE,
  REVIEW_START_OPEN_DIRECTLY_CTA,
} from "@/lib/review-start-progress-copy";

const assign = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  assign.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, assign },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("ReviewStartNavigationStallNotice", () => {
  it("announces a slow open as status rather than a failure", () => {
    render(<ReviewStartNavigationStallNotice href="/architecture/reviews/new?path=guided-intake" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText(REVIEW_START_NAVIGATION_STALL_MESSAGE)).toBeInTheDocument();
  });

  it("opens the same href with a full page load when the soft navigation stalled", () => {
    render(<ReviewStartNavigationStallNotice href="/architecture/reviews/new?path=guided-intake" />);

    fireEvent.click(screen.getByRole("button", { name: REVIEW_START_OPEN_DIRECTLY_CTA }));

    expect(assign).toHaveBeenCalledWith("/architecture/reviews/new?path=guided-intake");
  });

  it("derives the direct-open test id from the notice test id", () => {
    render(
      <ReviewStartNavigationStallNotice
        href="/architecture/reviews/new"
        testId="architecture-start-review-stall"
      />,
    );

    expect(screen.getByTestId("architecture-start-review-stall")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-start-review-stall-open-directly")).toBeInTheDocument();
  });
});

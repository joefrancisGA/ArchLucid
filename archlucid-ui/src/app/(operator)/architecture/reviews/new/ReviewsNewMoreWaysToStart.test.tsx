import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";

import { ReviewsNewMoreWaysToStart } from "./ReviewsNewMoreWaysToStart";

describe("ReviewsNewMoreWaysToStart", () => {
  it("lists secondary start paths without rendering their wizards", () => {
    const onSelectPath = vi.fn();

    render(<ReviewsNewMoreWaysToStart onSelectPath={onSelectPath} />);

    expect(screen.getByTestId("reviews-new-more-intake-options")).toBeInTheDocument();
    expect(screen.getByText(REVIEWS_NEW_PATH_HINTS["guided-intake"])).toBeInTheDocument();
    expect(screen.getByText(REVIEWS_NEW_PATH_HINTS.detailed)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("reviews-new-more-path-detailed"));

    expect(onSelectPath).toHaveBeenCalledWith("detailed");
  });
});

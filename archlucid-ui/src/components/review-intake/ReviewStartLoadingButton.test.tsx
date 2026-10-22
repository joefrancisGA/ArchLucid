import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";

describe("ReviewStartLoadingButton", () => {
  it("shows a spinner and loading label while active", () => {
    render(
      <ReviewStartLoadingButton
        idleLabel="Start architecture review"
        loadingLabel={REVIEW_START_PREPARING_LABEL}
        isLoading={true}
      />,
    );

    expect(screen.getByRole("button", { name: REVIEW_START_PREPARING_LABEL })).toBeDisabled();
    expect(screen.getByRole("button", { name: REVIEW_START_PREPARING_LABEL })).toHaveAttribute("aria-busy", "true");
  });

  it("keeps the idle label when not loading", () => {
    render(
      <ReviewStartLoadingButton
        idleLabel="Start architecture review"
        loadingLabel={REVIEW_START_PREPARING_LABEL}
        isLoading={false}
        onClick={() => undefined}
      />,
    );

    const button = screen.getByRole("button", { name: "Start architecture review" });
    fireEvent.click(button);
    expect(button).toHaveAttribute("data-loading", "false");
  });
});

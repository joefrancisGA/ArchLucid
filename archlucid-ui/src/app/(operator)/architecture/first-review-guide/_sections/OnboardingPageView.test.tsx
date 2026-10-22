import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingPageView } from "./OnboardingPageView";

vi.mock("./FirstReviewGuidePageClient", () => ({
  FirstReviewGuidePageClient: ({ model }: { model: { fromRegistration: boolean } }) => (
    <div data-testid="first-review-guide-page-client" data-from-registration={String(model.fromRegistration)} />
  ),
}));

describe("OnboardingPageView", () => {
  it("renders the first review guide client shell", () => {
    render(<OnboardingPageView model={{ fromRegistration: false }} />);

    expect(screen.getByTestId("first-review-guide-page-client")).toHaveAttribute("data-from-registration", "false");
  });
});

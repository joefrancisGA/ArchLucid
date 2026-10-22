import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OnboardingSampleReviewShortcut } from "@/components/usability/OnboardingSampleReviewShortcut";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("OnboardingSampleReviewShortcut", () => {
  it("links to the curated static demo review", () => {
    render(<OnboardingSampleReviewShortcut />);

    const link = screen.getByRole("link", { name: "Open sample review" });
    expect(link).toHaveAttribute("href", `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`);
  });
});

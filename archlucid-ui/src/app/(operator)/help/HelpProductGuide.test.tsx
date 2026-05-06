import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpProductGuide } from "./HelpProductGuide";

describe("HelpProductGuide", () => {
  it("surfaces the golden path and key deep links", () => {
    render(<HelpProductGuide />);

    expect(screen.getByRole("heading", { name: "Using ArchLucid" })).toBeInTheDocument();
    expect(screen.getByText("Golden path (first walkthrough)")).toBeInTheDocument();

    const newReviewTargets = screen
      .getAllByRole("link", { name: "New review" })
      .map((anchor) => anchor.getAttribute("href"));
    expect(newReviewTargets.filter((href) => href === "/reviews/new").length).toBeGreaterThanOrEqual(1);

    const reviewsTargets = screen
      .getAllByRole("link", { name: "Reviews" })
      .map((anchor) => anchor.getAttribute("href"));
    expect(reviewsTargets).toContain("/reviews?projectId=default");

    expect(screen.getByRole("link", { name: "Ask" })).toHaveAttribute("href", "/ask");
    expect(screen.getByRole("link", { name: "Governance" })).toHaveAttribute("href", "/governance");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/signin");
  });
});

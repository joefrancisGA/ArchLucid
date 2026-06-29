import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ReviewsNewPathSwitcher", () => ({
  ReviewsNewPathSwitcher: () => <div data-testid="reviews-new-path-switcher" />,
}));

vi.mock("@/components/usability/NewReviewSampleEscapeLink", () => ({
  NewReviewSampleEscapeLink: () => null,
}));

import NewRunPage from "./page";

describe("New Architecture Review page", () => {
  it("renders the title without an adjacent tooltip trigger", () => {
    render(<NewRunPage />);

    expect(screen.getByRole("heading", { level: 2, name: "New Architecture Review" })).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(screen.getByRole("link", { name: "Full pilot guidance" })).toBeInTheDocument();
    expect(
      screen.getByText(/Start with a diagram or document \(Quick start\), or let ArchLucid guide you through what to include \(Guided\)/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/architecture brief/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Guided intake/i)).not.toBeInTheDocument();
  });
});

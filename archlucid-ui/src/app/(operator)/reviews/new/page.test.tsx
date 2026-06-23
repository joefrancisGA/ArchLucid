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
    expect(screen.getByText(/Quick start when you already have an architecture brief or evidence file/i)).toBeInTheDocument();
    expect(screen.getByText(/Guided intake when you want ArchLucid to walk you through the context/i)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listArchitectureDraftRegistryEntries = vi.fn();

vi.mock("@/lib/architecture-draft-registry", () => ({
  listArchitectureDraftRegistryEntries: () => listArchitectureDraftRegistryEntries(),
}));

vi.mock("@/lib/architecture-draft-resume-telemetry", () => ({
  trackArchitectureDraftResumeClick: vi.fn(),
}));

import { ReviewsHubResumeDrafts } from "./ReviewsHubResumeDrafts";

beforeEach(() => {
  listArchitectureDraftRegistryEntries.mockReset();
});

describe("ReviewsHubResumeDrafts", () => {
  it("renders nothing when no drafts exist", () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([]);

    const { container } = render(<ReviewsHubResumeDrafts />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders draft resume links when drafts exist", () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      {
        architectureId: "draft-001",
        displayName: "Payments platform draft",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
    ]);

    render(<ReviewsHubResumeDrafts />);

    expect(screen.getByTestId("reviews-hub-resume-drafts")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Payments platform draft/i })).toHaveAttribute(
      "href",
      "/architectures/draft-001",
    );
    expect(screen.getByTestId("reviews-hub-resume-drafts-view-all")).toHaveAttribute("href", "/architectures");
  });
});

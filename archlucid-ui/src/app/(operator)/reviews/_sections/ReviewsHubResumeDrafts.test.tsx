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

  it("renders nothing when a single draft is already the header Continue target", () => {
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

    const { container } = render(<ReviewsHubResumeDrafts />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a supporting multi-draft strip with status, relative time, and actions", () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      {
        architectureId: "draft-001",
        displayName:
          "# Architecture Review Packet — Contoso Claims Intake Platform Modernization (Phase 1)",
        customerStatus: "ready-for-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
      {
        architectureId: "draft-002",
        displayName: "Second draft",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-16T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-16T12:00:00.000Z",
      },
    ]);

    render(<ReviewsHubResumeDrafts />);

    expect(screen.getByTestId("reviews-hub-resume-drafts")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Architectures ready for review" })).toBeInTheDocument();
    expect(screen.getByText("Ready for review")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-resume-draft-continue-draft-001")).toHaveAttribute(
      "href",
      "/architectures/draft-001",
    );
    expect(screen.getByTestId("reviews-hub-resume-draft-start-draft-001").getAttribute("href")).toContain(
      "/architecture/reviews/new",
    );
    expect(screen.getByTestId("reviews-hub-resume-drafts-view-all")).toHaveAttribute("href", "/architectures");
    expect(screen.getAllByText(/Updated /i).length).toBeGreaterThanOrEqual(2);
  });
});

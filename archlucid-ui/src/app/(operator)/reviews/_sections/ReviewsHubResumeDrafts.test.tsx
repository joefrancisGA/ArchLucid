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

  it("renders a multi-draft chooser with wrapped titles and view-all", () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      {
        architectureId: "draft-001",
        displayName:
          "# Architecture Review Packet — Contoso Claims Intake Platform Modernization (Phase 1)",
        customerStatus: "draft",
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

    render(<ReviewsHubResumeDrafts elevateAsPrimaryJob />);

    const section = screen.getByTestId("reviews-hub-resume-drafts");
    expect(section).toHaveAttribute("data-elevate-primary", "true");
    const longTitleLink = screen.getByRole("link", {
      name: /Architecture Review Packet/i,
    });
    expect(longTitleLink).toHaveAttribute("href", "/architectures/draft-001");
    expect(longTitleLink).toHaveAttribute(
      "title",
      "# Architecture Review Packet — Contoso Claims Intake Platform Modernization (Phase 1)",
    );
    expect(longTitleLink.querySelector(".line-clamp-2")).not.toBeNull();
    expect(screen.getByTestId("reviews-hub-resume-drafts-view-all")).toHaveAttribute("href", "/architectures");
  });
});

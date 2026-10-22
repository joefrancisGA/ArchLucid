import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useArchitectureDraftRegistryEntries = vi.fn();

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => useArchitectureDraftRegistryEntries(),
  useArchitectureDraftRegistryHydrated: () => true,
}));

vi.mock("@/lib/architecture/architecture-draft-resume-telemetry", () => ({
  trackArchitectureDraftResumeClick: vi.fn(),
}));

import { ReviewsHubResumeDrafts } from "./ReviewsHubResumeDrafts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: vi.fn(),
  reopenDraftRequest: vi.fn(),
}));

beforeEach(() => {
  useArchitectureDraftRegistryEntries.mockReset();
});

describe("ReviewsHubResumeDrafts", () => {
  it("renders nothing when no drafts exist", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    const { container } = render(<ReviewsHubResumeDrafts />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when a single draft is already the header Continue target", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      {
        draftId: "draft-001",
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
    useArchitectureDraftRegistryEntries.mockReturnValue([
      {
        draftId: "draft-001",
        displayName:
          "# Architecture Review Package — Contoso Claims Intake Platform Modernization (Phase 1)",
        customerStatus: "ready-for-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
      {
        draftId: "draft-002",
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
    expect(screen.getByRole("heading", { name: /Architectures ready for review/ })).toBeInTheDocument();
    expect(screen.getByText("Ready for review")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-resume-draft-continue-draft-001")).toHaveTextContent("Continue editing");
    expect(screen.getByTestId("reviews-hub-resume-draft-start-draft-001").getAttribute("href")).toContain(
      "/architecture/reviews/new",
    );
    expect(screen.getByTestId("reviews-hub-resume-drafts-view-all")).toHaveAttribute("href", "/architecture/architectures");
    expect(screen.getAllByText(/Updated /i).length).toBeGreaterThanOrEqual(2);
  });

  it("excludes archived and review-linked drafts from the ready-for-review count and preview", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      {
        draftId: "draft-001",
        displayName: "Eligible draft",
        customerStatus: "ready-for-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
      {
        draftId: "draft-002",
        displayName: "Archived draft",
        customerStatus: "archived",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-16T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-16T12:00:00.000Z",
      },
      {
        draftId: "draft-003",
        displayName: "Review-linked draft",
        customerStatus: "review-linked",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-17T12:00:00.000Z",
        linkedReviewId: "review-1",
        serverUpdatedUtc: "2026-01-17T12:00:00.000Z",
      },
      {
        draftId: "draft-004",
        displayName: "Second eligible draft",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-18T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-18T12:00:00.000Z",
      },
    ]);

    render(<ReviewsHubResumeDrafts />);

    expect(screen.getByRole("heading", { name: /Architectures ready for review.*2/ })).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-resume-draft-draft-001")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-resume-draft-draft-004")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-resume-draft-draft-002")).toBeNull();
    expect(screen.queryByTestId("reviews-hub-resume-draft-draft-003")).toBeNull();
  });

  it("renders nothing when only archived drafts exist", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      {
        draftId: "draft-001",
        displayName: "Archived one",
        customerStatus: "archived",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
      {
        draftId: "draft-002",
        displayName: "Archived two",
        customerStatus: "archived",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-16T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-16T12:00:00.000Z",
      },
    ]);

    const { container } = render(<ReviewsHubResumeDrafts />);

    expect(container).toBeEmptyDOMElement();
  });
});

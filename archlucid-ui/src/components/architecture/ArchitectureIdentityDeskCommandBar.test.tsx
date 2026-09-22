import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/architectures/architecture-identity-001",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: "working" as const,
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: true,
    setAndPersist: vi.fn(),
  }),
}));

import { ArchitectureIdentityDeskCommandBar } from "@/components/architecture/ArchitectureIdentityDeskCommandBar";

const architectureId = "architecture-identity-001";

const reviews: ArchitectureIdentityChildReviewSummary[] = [
  {
    runId: "review-2",
    description: "Second in-flight review",
    createdUtc: "2026-01-02T11:00:00Z",
  },
  {
    runId: "review-1",
    description: "First sealed review",
    createdUtc: "2026-01-01T10:00:00Z",
  },
];

describe("ArchitectureIdentityDeskCommandBar (SG-055)", () => {
  it("renders visible desk verbs scoped to the open architecture", () => {
    render(
      <ArchitectureIdentityDeskCommandBar
        architectureId={architectureId}
        reviews={reviews}
        latestReviewId="review-2"
      />,
    );

    expect(screen.getByTestId("architecture-identity-desk-command-bar")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-identity-desk-command-ask")).toHaveAttribute(
      "href",
      expect.stringContaining(`/architecture/architectures/${architectureId}/ask`),
    );
    expect(screen.getByTestId("architecture-identity-desk-command-compare")).toHaveAttribute(
      "href",
      expect.stringContaining(`/architecture/architectures/${architectureId}/compare`),
    );
    expect(screen.getByTestId("architecture-identity-desk-command-graph")).toHaveAttribute(
      "href",
      expect.stringContaining(`/architecture/architectures/${architectureId}/graph`),
    );
    expect(screen.getByTestId("architecture-identity-desk-command-findings")).toHaveAttribute(
      "href",
      expect.stringContaining(`/architecture/architectures/${architectureId}/findings`),
    );
    expect(screen.getByTestId("architecture-identity-desk-command-search")).toHaveAttribute(
      "href",
      `/architecture/architectures/${architectureId}/search`,
    );
    expect(screen.getByTestId("architecture-identity-desk-command-start-review")).toHaveAttribute(
      "href",
      `/architecture/architectures/${architectureId}/reviews/new`,
    );
  });
});

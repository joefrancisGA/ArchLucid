import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ArchitectureIdentityDeskReviewsTable } from "@/components/architecture/ArchitectureIdentityDeskReviewsTable";

const architectureId = "architecture-identity-001";
const reviews: readonly ArchitectureIdentityChildReviewSummary[] = [
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

describe("ArchitectureIdentityDeskReviewsTable (AO-23)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = true;
  });

  it("links review rows to nested job paths", () => {
    render(
      <ArchitectureIdentityDeskReviewsTable
        architectureId={architectureId}
        reviews={reviews}
        reviewCount={reviews.length}
        startReviewHref="/architecture/architectures/architecture-identity-001/reviews/new?path=guided-intake"
      />,
    );

    expect(screen.getByRole("link", { name: "Second in-flight review" })).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001/reviews/review-2",
    );
    expect(screen.getByTestId("architecture-identity-reviews-table")).toBeInTheDocument();
  });

  it("empty state offers Start review on the architecture desk, not the reviews hub", () => {
    render(
      <ArchitectureIdentityDeskReviewsTable
        architectureId={architectureId}
        reviews={[]}
        startReviewHref="/architecture/architectures/architecture-identity-001/reviews/new?path=guided-intake"
      />,
    );

    expect(screen.getByTestId("architecture-identity-start-review")).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001/reviews/new?path=guided-intake",
    );
    expect(screen.queryByRole("link", { name: /reviews hub/i })).toBeNull();
  });
});

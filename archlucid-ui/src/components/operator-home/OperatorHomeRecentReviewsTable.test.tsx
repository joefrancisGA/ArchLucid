import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeRecentReviewsTable } from "@/components/operator-home/OperatorHomeRecentReviewsTable";
import {
  OPERATOR_HOME_OPEN_REVIEW_RECORD_CTA,
  OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("OperatorHomeRecentReviewsTable", () => {
  it("returns null when there are no runs", () => {
    const { container } = render(<OperatorHomeRecentReviewsTable runs={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("marks showcase and demo-seeded rows with the sample-data badge", () => {
    const runs: RunSummary[] = [
      {
        runId: "tenant-run-1",
        projectId: "default",
        displayTitle: "Tenant review",
      },
      {
        runId: SHOWCASE_STATIC_DEMO_RUN_ID,
        projectId: "default",
        displayTitle: "Showcase review",
      },
      {
        runId: "demo-seeded-run",
        projectId: "default",
        demoSeededOverviewInject: true,
        displayTitle: "Demo seeded review",
      },
    ];

    render(<OperatorHomeRecentReviewsTable runs={runs} />);

    expect(screen.getByTestId("operator-home-recent-reviews-table")).toBeInTheDocument();
    expect(
      screen.getByTestId(`operator-home-recent-review-row-${SHOWCASE_STATIC_DEMO_RUN_ID}`),
    ).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-recent-review-row-tenant-run-1")).toBeInTheDocument();

    const badges = screen.getAllByTestId("demo-data-badge");

    expect(badges).toHaveLength(2);
    expect(
      within(screen.getByTestId("operator-home-recent-review-row-tenant-run-1")).queryByTestId(
        "demo-data-badge",
      ),
    ).toBeNull();
  });

  it("uses Open review record for finalized packages and Continue review for in-progress rows", () => {
    const runs: RunSummary[] = [
      {
        runId: "approved-run",
        projectId: "default",
        hasGoldenManifest: true,
        createdUtc: "2026-01-01T00:00:00.000Z",
      },
      {
        runId: "active-run",
        projectId: "default",
        hasFindingsSnapshot: true,
        createdUtc: "2026-01-02T00:00:00.000Z",
      },
    ];

    render(<OperatorHomeRecentReviewsTable runs={runs} />);

    expect(
      within(screen.getByTestId("operator-home-recent-review-row-approved-run")).getByRole("link", {
        name: OPERATOR_HOME_OPEN_REVIEW_RECORD_CTA,
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("operator-home-recent-review-row-active-run")).getByRole("link", {
        name: OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA,
      }),
    ).toBeInTheDocument();
  });
});

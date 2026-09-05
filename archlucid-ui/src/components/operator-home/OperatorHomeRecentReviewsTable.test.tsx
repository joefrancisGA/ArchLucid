import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeRecentReviewsTable } from "@/components/operator-home/OperatorHomeRecentReviewsTable";
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
});

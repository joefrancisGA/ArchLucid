import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/",
  });
});

import { OperatorHomeReviewSummaryCard } from "@/components/operator-home/OperatorHomeReviewSummaryCard";
import { runListPrimaryTitle } from "@/components/operator-home/runs-dashboard-helpers";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type { RunSummary } from "@/types/authority";

describe("OperatorHomeReviewSummaryCard", () => {
  it("renders status tag and metadata for an in-progress review", () => {
    const run: RunSummary = {
      runId: "review-001",
      projectId: "default",
      description: "Payments platform",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
      findingCount: 3,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href="/architecture/reviews/review-001"
        buyerPolishedShell
      />,
    );

    expect(screen.getByTestId("run-home-status-tag-review-001")).toHaveTextContent("Action needed");
    expect(screen.getByText("Findings")).toBeInTheDocument();
    expect(screen.getByText("3 findings")).toBeInTheDocument();
    expect(screen.getByTestId("run-home-list-insight-review-001")).toHaveTextContent(
      "3 findings ready · finalize this review to lock export readiness",
    );
  });

  it("renders compact featured showcase summary with details disclosure (TB-1998)", () => {
    const run: RunSummary = {
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "default",
      description: "Claims Intake sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
      findingCount: 4,
      warningCount: 1,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href={`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`}
        buyerPolishedShell
        variant="featured"
        primaryAction={{ href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`, label: "Open review" }}
      />,
    );

    expect(screen.getByTestId("runs-dashboard-buyer-proof-summary")).toBeInTheDocument();
    expect(screen.getByTestId("runs-dashboard-buyer-proof-title")).toHaveTextContent(
      SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
    );
    expect(screen.getByTestId("runs-dashboard-buyer-proof-title").tagName).toBe("A");
    expect(screen.getByText("Package finalized")).toBeInTheDocument();
    expect(screen.getByText("Findings")).toBeInTheDocument();
    expect(screen.getByText("9 findings · 1 monitored risk")).toBeInTheDocument();
    expect(screen.getByText("Finalized")).toBeInTheDocument();
    expect(
      screen.getByText(buyerDemoPackageCardMeta(SHOWCASE_STATIC_DEMO_RUN_ID)?.decisionDate ?? ""),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Decision:/)).toBeNull();
    expect(screen.getByTestId("runs-dashboard-buyer-proof-details")).toHaveTextContent(/Approver: Jordan Lee/);
    expect(screen.getByRole("link", { name: "Open review" })).toBeInTheDocument();
    const viewRecordLink = screen.getByRole("link", { name: "View record" });
    expect(viewRecordLink).toHaveAttribute(
      "href",
      signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID),
    );
    expect(viewRecordLink.className).toContain("underline");
    expect(viewRecordLink.className).toContain("text-[var(--al-accent-link)]");

    const details = screen.getByTestId("runs-dashboard-buyer-proof-details");
    expect(details).toBeInTheDocument();
    const detailsSummary = details.querySelector("summary");
    expect(detailsSummary).toHaveTextContent("Details");
    expect(detailsSummary?.className).toContain("underline");
    expect(detailsSummary?.className).toContain("text-[var(--al-accent-link)]");

    fireEvent.click(details.querySelector("summary")!);
    expect(screen.getByText(/monitored PHI risk is counted among findings but does not block approval/)).toBeInTheDocument();

    const finalizedRecordLink = screen.getByTestId("runs-dashboard-buyer-proof-finalized-record-link");
    expect(finalizedRecordLink).toHaveTextContent(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
    expect(finalizedRecordLink).toHaveAttribute("href", signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID));
    expect(finalizedRecordLink).toHaveAttribute("title", SHOWCASE_STATIC_DEMO_MANIFEST_ID);
    expect(screen.getByRole("button", { name: "Copy finalized review record ID" })).toBeInTheDocument();
  });

  it("demotes featured primary CTA when command center owns the page primary", () => {
    const run: RunSummary = {
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "default",
      description: "Claims Intake sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
      findingCount: 4,
      warningCount: 1,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href={`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`}
        buyerPolishedShell
        variant="featured"
        primaryAction={{ href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`, label: "Open review" }}
        pagePrimaryOwnedElsewhere
      />,
    );

    const openReviewLink = screen.getByRole("link", { name: "Open review" });
    const viewRecordLink = screen.getByRole("link", { name: "View record" });
    const detailsSummary = screen.getByTestId("runs-dashboard-buyer-proof-details").querySelector("summary");

    expect(openReviewLink.className).toContain("underline");
    expect(viewRecordLink.className).toContain("underline");
    expect(detailsSummary?.className).toContain("underline");
    expect(openReviewLink.className).toContain("text-[var(--al-accent-link)]");
    expect(viewRecordLink.className).toContain("text-[var(--al-accent-link)]");
    expect(detailsSummary?.className).toContain("text-[var(--al-accent-link)]");
  });

  it("states the governance verdict once, on the status tag", () => {
    const run: RunSummary = {
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "default",
      description: "Claims Intake sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
      findingCount: 4,
      warningCount: 1,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href={`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`}
        buyerPolishedShell
        variant="featured"
      />,
    );

    expect(screen.getByTestId(`run-home-status-tag-${SHOWCASE_STATIC_DEMO_RUN_ID}`)).toHaveTextContent(
      "Approved with monitoring",
    );
    expect(screen.getAllByText(/Approved with monitoring/)).toHaveLength(1);
  });

  it("labels package origin inside featured details so it does not read as a second verdict", () => {
    const run: RunSummary = {
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "default",
      description: "Claims Intake sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
      packageOrigin: "Reviewed",
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href={`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`}
        buyerPolishedShell
        variant="featured"
      />,
    );

    fireEvent.click(screen.getByText("Details"));

    expect(screen.getByText(/Approver: Jordan Lee/)).toBeInTheDocument();

    const origin = screen.getByTestId("architecture-package-origin-reviewed");

    expect(origin.textContent).toMatch(/Package origin:\s*Reviewed/);
  });

  it("renders compact demo badge for showcase reviews", () => {
    const run: RunSummary = {
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "default",
      description: "Claims Intake sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href={`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`}
        buyerPolishedShell
        variant="compact"
      />,
    );

    expect(screen.getByTestId("demo-data-badge")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: runListPrimaryTitle(run) })).toHaveAttribute(
      "title",
      runListPrimaryTitle(run),
    );
  });
});

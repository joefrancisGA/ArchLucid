import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeReviewSummaryCard } from "@/components/operator-home/OperatorHomeReviewSummaryCard";
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
    expect(screen.getByText(/9 findings, including 1 monitored risk under active review/)).toBeInTheDocument();
    expect(screen.getByText("Finalized")).toBeInTheDocument();
    expect(
      screen.getByText(buyerDemoPackageCardMeta(SHOWCASE_STATIC_DEMO_RUN_ID)?.decisionDate ?? ""),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Decision:/)).toBeNull();
    expect(screen.getByTestId("runs-dashboard-buyer-proof-details")).toHaveTextContent(/Approver: Jordan Lee/);
    expect(screen.getByRole("link", { name: "Open review" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View record" })).toHaveAttribute(
      "href",
      signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID),
    );

    const details = screen.getByTestId("runs-dashboard-buyer-proof-details");
    expect(details).toBeInTheDocument();
    expect(details.querySelector("summary")).toHaveTextContent("Details");

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

    expect(screen.getByRole("link", { name: "Open review" }).className).toContain("border-neutral-300");
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
});

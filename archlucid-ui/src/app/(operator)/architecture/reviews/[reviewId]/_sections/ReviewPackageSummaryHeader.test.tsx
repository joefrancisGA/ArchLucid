import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/runs/RunDetailPageHeader", () => ({
  RunDetailPageHeader: () => <div data-testid="run-detail-page-header-mock" />,
}));

vi.mock("./ReviewPackagePrimaryAction", () => ({
  ReviewPackagePrimaryAction: ({
    demoted,
  }: {
    demoted?: boolean;
  }) => <div data-testid="review-package-primary-action-mock" data-demoted={demoted === true ? "true" : "false"} />,
}));

import { ReviewPackageSummaryHeader } from "./ReviewPackageSummaryHeader";

describe("ReviewPackageSummaryHeader component", () => {
  it("demotes the summary header primary when requested", () => {
    render(
      <ReviewPackageSummaryHeader
        mode="in-progress"
        pageHeader={{
          runSummary: { runId: "run-1", description: "Payments review" },
          runId: "run-1",
          headline: "Payments review",
          hasGoldenManifest: false,
        }}
        plainSummary={null}
        evidenceDensity={null}
        outcomeCards={null}
        attentionLineInput={{
          mode: "draft",
          blockingFindingCount: 0,
          hasCommitBlockingFailures: false,
          proofPacketExportReady: false,
          hasGoldenManifest: false,
        }}
        showCtoDemoAuditButton={false}
        primaryAction={{
          kind: "review-findings",
          label: "Review findings",
          href: "/architecture/reviews/run-1?reviewTab=findings",
        }}
        primaryActionRunId="run-1"
        primaryActionHasGoldenManifest={false}
        primaryActionCommitBlockedReason={null}
        demoteHeaderFinalizeButton
        demotePrimaryAction
      />,
    );

    expect(screen.getByTestId("review-package-primary-action-mock")).toHaveAttribute("data-demoted", "true");
  });
});

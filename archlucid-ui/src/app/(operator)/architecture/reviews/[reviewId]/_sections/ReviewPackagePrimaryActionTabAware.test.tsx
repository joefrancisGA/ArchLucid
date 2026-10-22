import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
}));

vi.mock("./ReviewPackagePrimaryAction", () => ({
  ReviewPackagePrimaryAction: ({
    demoted,
    action,
  }: {
    demoted?: boolean;
    action: { label: string };
  }) => (
    <div data-testid="review-package-primary-action-mock" data-demoted={demoted === true ? "true" : "false"}>
      {action.label}
    </div>
  ),
}));

import { ReviewPackagePrimaryActionTabAware } from "./ReviewPackagePrimaryActionTabAware";

describe("ReviewPackagePrimaryActionTabAware", () => {
  it("demotes the tab-aware primary when Do this next owns the page primary", () => {
    render(
      <ReviewPackagePrimaryActionTabAware
        action={{
          kind: "review-findings",
          label: "Review findings",
          href: "/architecture/reviews/run-1?reviewTab=findings",
        }}
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        primaryActionContext={{
          runId: "run-1",
          manifestId: null,
          hasCommitBlockingFailures: false,
          blockingFindingCount: 0,
          buyerPolishedArtifactTable: false,
          operatorGovernanceDecision: null,
          manifestStatus: "Draft",
          runCompleted: false,
        }}
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(screen.getByTestId("review-package-primary-action-mock")).toHaveAttribute("data-demoted", "true");
  });
});

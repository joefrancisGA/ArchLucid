import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

vi.mock("@/components/reviews/ReviewHeaderShareMenu", () => ({
  ReviewHeaderShareMenu: ({
    disabled,
    disabledReason,
  }: {
    disabled?: boolean;
    disabledReason?: { message: string } | null;
  }) => (
    <div
      data-testid="review-header-share-menu"
      data-disabled={disabled === true ? "true" : "false"}
      data-disabled-reason={disabledReason?.message ?? ""}
    />
  ),
}));

vi.mock("@/components/reviews/ReviewPresenterHeaderButton", () => ({
  ReviewPresenterHeaderButton: () => null,
}));

vi.mock("@/components/reviews/ReviewAskDock", () => ({
  ReviewAskDock: ({
    disabled,
    disabledReason,
  }: {
    disabled?: boolean;
    disabledReason?: { message: string } | null;
  }) => (
    <div
      data-testid="review-ask-dock"
      data-disabled={disabled === true ? "true" : "false"}
      data-disabled-reason={disabledReason?.message ?? ""}
    />
  ),
}));

vi.mock("@/components/CopyIdButton", () => ({
  CopyIdButton: () => <button type="button">Copy</button>,
}));

vi.mock("./ReviewPackagePrimaryAction", () => ({
  ReviewPackagePrimaryAction: ({
    action,
    commitBlockedReason,
    demoted,
  }: {
    action: { label: string; kind: string };
    commitBlockedReason?: string | null;
    demoted?: boolean;
  }) => (
    <div data-testid="review-package-primary-action-mock" data-demoted={demoted === true ? "true" : "false"}>
      <button type="button">{action.label}</button>
      {commitBlockedReason !== null && commitBlockedReason !== undefined && commitBlockedReason.length > 0 ? (
        <div data-testid="commit-blocked-reason">{commitBlockedReason}</div>
      ) : null}
    </div>
  ),
}));

import {
  RunDetailWorkspaceBlockingBanner,
  RunDetailWorkspaceHeader,
} from "./RunDetailWorkspaceChrome";
import { RunDetailWorkspaceStickyActions } from "./RunDetailWorkspaceStickyActions";

const workspaceStatus = {
  label: "Finalized · approval blocked",
  kind: "finalized" as const,
  statusTagKind: "needs-attention" as const,
};

const executionFailedWorkspaceStatus = {
  label: "Execution failed",
  kind: "execution-failed" as const,
  statusTagKind: "needs-attention" as const,
};

const reviewRunId = "851472cf-1234-5678-9abc-def083248324";
const finalizedRecordId = "9026d565-0000-0000-0000-0000000099e8";

describe("RunDetailWorkspaceHeader", () => {
  it("renders system title, provenance slots, and full review identifier with copy control", () => {
    render(
      <RunDetailWorkspaceHeader
        runId={reviewRunId}
        h1Title="Claims API"
        eyebrowLabel="Claims platform review"
        reviewIdentifierLabel={reviewRunId}
        signedReviewRecordId={finalizedRecordId}
        signedReviewRecordIdLabel={finalizedRecordId}
        workspaceStatus={workspaceStatus}
        reviewOwner={null}
        templateLabel={null}
        finalizedAtLabel="Jan 1, 2026, 12:00 PM"
        packageVersionLabel="v2"
      />,
    );

    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Claims API" })).toBeInTheDocument();
    expect(screen.getByText("Claims platform review")).toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-review-identifiers")).not.toBeInTheDocument();
    expect(screen.getByTestId("run-detail-record-metadata-disclosure")).toBeInTheDocument();
    expect(screen.getByText("Review ID")).toBeInTheDocument();
    expect(screen.getByText("Finalized review record ID")).toBeInTheDocument();
    expect(screen.getByText(reviewRunId)).toBeInTheDocument();
    expect(screen.getByText(finalizedRecordId)).toBeInTheDocument();
    expect(
      screen.getByText("Not recorded — this record does not name who recorded the decision"),
    ).toBeInTheDocument();
    expect(screen.getByText("Not recorded — no review template captured for this package")).toBeInTheDocument();
    expect(screen.getByText("Jan 1, 2026, 12:00 PM")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByTestId("favorite-review-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("review-header-share-menu")).toHaveAttribute("data-disabled", "false");
    expect(screen.getByTestId("review-ask-dock")).toHaveAttribute("data-disabled", "false");
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-object-map-strip")).toBeInTheDocument();
  });

  it("collapses sparse metadata into a disclosure with reason copy", () => {
    render(
      <RunDetailWorkspaceHeader
        runId="run-1"
        h1Title="Claims API"
        eyebrowLabel="Architecture review"
        reviewIdentifierLabel="run-1"
        signedReviewRecordId="manifest-9026"
        signedReviewRecordIdLabel="manifest-9026"
        workspaceStatus={workspaceStatus}
        reviewOwner={null}
        templateLabel={null}
        finalizedAtLabel={null}
        packageVersionLabel={null}
      />,
    );

    expect(screen.getByTestId("run-detail-record-metadata-disclosure")).toBeInTheDocument();
    expect(screen.getByText("Record metadata (4 fields not recorded)")).toBeInTheDocument();
    expect(screen.getByText("Not recorded — finalization timestamp missing from the finalized review record")).toBeInTheDocument();
    expect(screen.getByText("Not recorded — rule set version missing")).toBeInTheDocument();
  });

  it("hides finalization metadata when execution failed before review completes", () => {
    render(
      <RunDetailWorkspaceHeader
        runId="run-1"
        h1Title="ArchLucid"
        eyebrowLabel="Architecture review"
        reviewIdentifierLabel="run-1"
        signedReviewRecordId={null}
        signedReviewRecordIdLabel={null}
        workspaceStatus={executionFailedWorkspaceStatus}
        reviewOwner={null}
        templateLabel={null}
        finalizedAtLabel={null}
        packageVersionLabel={null}
      />,
    );

    expect(screen.queryByTestId("run-detail-record-metadata-disclosure")).not.toBeInTheDocument();
    expect(screen.queryByText("Finalization metadata (available after review completes)")).toBeNull();
    expect(screen.queryByText(/fields not recorded/i)).toBeNull();
    expect(
      screen.queryByText("Not applicable — review template is recorded when the review finalizes"),
    ).toBeNull();
    expect(screen.queryByText("Not applicable — review has not been finalized")).toBeNull();
    expect(
      screen.queryByText("Not applicable — package version is recorded when the review finalizes"),
    ).toBeNull();
    expect(screen.queryByText("Not applicable — no finalized review record yet")).toBeNull();
    expect(
      screen.queryByText("Not applicable — no approval decision until the review is finalized"),
    ).toBeNull();
    expect(screen.getByTestId("review-header-share-menu")).toHaveAttribute("data-disabled", "true");
    expect(screen.getByTestId("review-ask-dock")).toHaveAttribute("data-disabled", "true");
    expect(screen.getByTestId("review-header-share-menu")).toHaveAttribute(
      "data-disabled-reason",
      "Unavailable until the review completes. Resolve the execution failure and re-run the review.",
    );
  });

  it("clamps an oversized h1 title to one line without markdown", () => {
    const blob = `**Reviewed** ${"classification ".repeat(200)}`;
    render(
      <RunDetailWorkspaceHeader
        runId="run-1"
        h1Title={blob}
        eyebrowLabel="Architecture review"
        reviewIdentifierLabel="run-1"
        signedReviewRecordId={null}
        signedReviewRecordIdLabel={null}
        workspaceStatus={workspaceStatus}
        reviewOwner={null}
        templateLabel={null}
        finalizedAtLabel="Jan 1, 2026, 12:00 PM"
        packageVersionLabel="v2"
      />,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent!.length).toBeLessThanOrEqual(120);
    expect(heading.textContent).not.toContain("**");
  });
});

describe("RunDetailWorkspaceBlockingBanner", () => {
  it("renders blocked callout without a duplicate next-step link", () => {
    render(<RunDetailWorkspaceBlockingBanner blockingCount={1} />);

    expect(screen.getByTestId("run-detail-blocking-approval-banner")).toBeInTheDocument();
    expect(screen.getByText(/1 unresolved finding currently blocks approval/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Review blocking finding" })).not.toBeInTheDocument();
  });
});

describe("RunDetailWorkspaceStickyActions", () => {
  it("shows blocking helper text and a single primary action", () => {
    render(
      <RunDetailWorkspaceStickyActions
        runId="run-1"
        primaryAction={{
          kind: "review-findings",
          label: "Disposition blocking findings",
          href: "/architecture/reviews/run-1?reviewTab=findings",
        }}
        primaryActionContext={{
          runId: "run-1",
          manifestId: "manifest-1",
          hasCommitBlockingFailures: false,
          blockingFindingCount: 1,
          buyerPolishedArtifactTable: true,
          operatorGovernanceDecision: null,
          manifestStatus: "Finalized",
          runCompleted: true,
        }}
        commitBlockedReason={null}
        showProgressTracker={false}
        manifestId="manifest-1"
      />,
    );

    expect(screen.getByText(/1 unresolved finding currently blocks approval/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Resolve blocking finding first" })).toBeNull();
    expect(screen.getByRole("button", { name: "Disposition blocking findings" })).toBeInTheDocument();
  });

  it("passes commitBlockedReason through when assessment coverage blocks finalize", () => {
    render(
      <RunDetailWorkspaceStickyActions
        runId="run-1"
        primaryAction={{
          kind: "finalize-package",
          label: "Finalize review",
          href: null,
        }}
        primaryActionContext={{
          runId: "run-1",
          manifestId: null,
          hasCommitBlockingFailures: false,
          blockingFindingCount: 0,
          buyerPolishedArtifactTable: false,
          operatorGovernanceDecision: null,
          manifestStatus: "Draft",
          runCompleted: true,
        }}
        commitBlockedReason="Assessment coverage is incomplete for architecture structure. Re-run the review before finalizing."
        showProgressTracker={false}
        manifestId={null}
      />,
    );

    expect(screen.getByTestId("commit-blocked-reason")).toHaveTextContent(
      "Assessment coverage is incomplete for architecture structure. Re-run the review before finalizing.",
    );
    expect(screen.getByRole("button", { name: "Finalize review" })).toBeInTheDocument();
  });

  it("demotes sticky primary action when Do this next owns the page primary", () => {
    const { container } = render(
      <RunDetailWorkspaceStickyActions
        runId="run-1"
        primaryAction={{
          kind: "review-findings",
          label: "Review findings",
          href: "/architecture/reviews/run-1?reviewTab=findings",
        }}
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
        commitBlockedReason={null}
        showProgressTracker={false}
        manifestId={null}
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

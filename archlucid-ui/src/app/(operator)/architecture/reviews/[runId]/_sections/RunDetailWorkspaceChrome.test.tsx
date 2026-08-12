import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
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
}));

vi.mock("@/components/CopyIdButton", () => ({
  CopyIdButton: () => <button type="button">Copy</button>,
}));

vi.mock("./ReviewPackagePrimaryAction", () => ({
  ReviewPackagePrimaryAction: ({
    action,
    commitBlockedReason,
  }: {
    action: { label: string; kind: string };
    commitBlockedReason?: string | null;
  }) => (
    <div>
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

describe("RunDetailWorkspaceHeader", () => {
  it("renders system title, provenance slots, and review identifier", () => {
    render(
      <RunDetailWorkspaceHeader
        runId="run-1"
        h1Title="Claims API"
        eyebrowLabel="Claims platform review"
        reviewIdentifierLabel="run-1"
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
    expect(screen.getByText("Review ID")).toBeInTheDocument();
    expect(screen.getByText("run-1")).toBeInTheDocument();
    expect(screen.getAllByText("Not recorded")).toHaveLength(2);
    expect(screen.getByText("Jan 1, 2026, 12:00 PM")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByTestId("favorite-review-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("clamps an oversized h1 title to one line without markdown", () => {
    const blob = `**Reviewed** ${"classification ".repeat(200)}`;
    render(
      <RunDetailWorkspaceHeader
        runId="run-1"
        h1Title={blob}
        eyebrowLabel="Architecture review"
        reviewIdentifierLabel="run-1"
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
});

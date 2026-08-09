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
  ReviewPackagePrimaryAction: ({ action }: { action: { label: string } }) => (
    <button type="button">{action.label}</button>
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

    expect(screen.getByRole("heading", { level: 1, name: "Claims API" })).toBeInTheDocument();
    expect(screen.getByText("Claims platform review")).toBeInTheDocument();
    expect(screen.getByText("Review ID")).toBeInTheDocument();
    expect(screen.getByText("run-1")).toBeInTheDocument();
    expect(screen.getAllByText("Not recorded")).toHaveLength(2);
    expect(screen.getByText("Jan 1, 2026, 12:00 PM")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});

describe("RunDetailWorkspaceBlockingBanner", () => {
  it("renders blocked callout with deep link to the blocking finding", () => {
    render(
      <RunDetailWorkspaceBlockingBanner
        blockingCount={1}
        findingsTabHref="/architecture/reviews/run-1?reviewTab=findings#finding-workspace-card-f-1"
      />,
    );

    expect(screen.getByTestId("run-detail-blocking-approval-banner")).toBeInTheDocument();
    expect(screen.getByText(/1 unresolved finding currently blocks approval/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review blocking finding" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1?reviewTab=findings#finding-workspace-card-f-1",
    );
  });
});

describe("RunDetailWorkspaceStickyActions", () => {
  it("shows blocking helper text instead of a record-decision shortcut", () => {
    render(
      <RunDetailWorkspaceStickyActions
        runId="run-1"
        primaryAction={{
          kind: "review-findings",
          label: "Confirm evidence and remediation ownership",
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

    expect(screen.getByText(/Resolve blocking finding first/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Record decision" })).toBeNull();
    expect(screen.getByRole("button", { name: "Confirm evidence and remediation ownership" })).toBeInTheDocument();
  });
});

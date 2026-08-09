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

vi.mock("./ReviewPackagePrimaryAction", () => ({
  ReviewPackagePrimaryAction: ({ action }: { action: { label: string } }) => (
    <button type="button">{action.label}</button>
  ),
}));

import { RunDetailWorkspaceHeader } from "./RunDetailWorkspaceChrome";
import { RunDetailWorkspaceStickyActions } from "./RunDetailWorkspaceStickyActions";

describe("RunDetailWorkspaceHeader", () => {
  it("renders review title, status metadata, and contextual help", () => {
    render(
      <RunDetailWorkspaceHeader
        reviewTitle="Claims platform review"
        systemName="Claims API"
        workspaceStatus={{ label: "In progress", statusTagKind: "pending" }}
        reviewOwner="Jordan Lee"
        templateLabel="Architecture review"
        runId="run-1"
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Claims platform review" })).toBeInTheDocument();
    expect(screen.getByText("Claims API")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("review-workspace-orientation")).toBeNull(); // TB-2092
  });
});

describe("RunDetailWorkspaceStickyActions", () => {
  it("keeps navigation helpers on the left and a single primary action on the right", () => {
    render(
      <RunDetailWorkspaceStickyActions
        runId="run-1"
        primaryAction={{ kind: "finalize-package", label: "Finalize review", href: null }}
        primaryActionContext={{
          runId: "run-1",
          manifestId: null,
          hasCommitBlockingFailures: false,
          blockingFindingCount: 0,
          buyerPolishedArtifactTable: false,
          operatorGovernanceDecision: null,
          manifestStatus: null,
          runCompleted: false,
        }}
        commitBlockedReason={null}
        showProgressTracker={false}
        manifestId={null}
      />,
    );

    expect(screen.getByRole("button", { name: "Finalize review" })).toBeInTheDocument();
  });
});

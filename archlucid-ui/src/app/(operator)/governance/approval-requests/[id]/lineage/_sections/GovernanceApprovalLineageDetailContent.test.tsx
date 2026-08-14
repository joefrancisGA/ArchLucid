/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GovernanceApprovalLineageDetailContent } from "./GovernanceApprovalLineageDetailContent";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <button type="button">{triggerText ?? "Help"}</button>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function sampleLineage(): GovernanceLineageResult {
  return {
    approvalRequest: {
      approvalRequestId: "claims-intake-approval-001",
      runId: "customer-intake-modernization",
      manifestVersion: "3.4.1",
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      status: "Approved",
      requestedBy: "Alex Kim",
      reviewedBy: "Taylor Morgan",
      requestComment: "Promote claims intake modernization",
      reviewComment: null,
      requestedUtc: "2026-01-14T20:00:00.000Z",
      reviewedUtc: "2026-01-14T22:00:00.000Z",
    },
    run: {
      runId: "customer-intake-modernization",
      status: "Finalized",
      createdUtc: "2026-01-12T10:00:00.000Z",
      completedUtc: "2026-01-14T22:00:00.000Z",
      currentManifestVersion: "3.4.1",
    },
    manifest: {
      manifestVersion: "3.4.1",
      decisionCount: 12,
      unresolvedIssueCount: 2,
      complianceGapCount: 1,
      signedBy: "Taylor Morgan",
      signedUtc: "2026-01-14T22:00:00.000Z",
      verificationStatus: "Verified",
      recordDigest: "sha256-demo-7f91c4aab3…",
    },
    topFindings: [
      {
        findingId: "sensitive-data-minimization-risk",
        title: "Residual PHI minimization risk (monitored)",
        engineType: "Policy",
        severity: "High",
        traceCompletenessRatio: 0.92,
      },
      {
        findingId: "logging-gap",
        title: "Logging retention gap",
        engineType: "Policy",
        severity: "Low",
        traceCompletenessRatio: 0.8,
      },
    ],
    riskPosture: "Approved with monitoring",
    promotions: [
      {
        promotionRecordId: "promo-1",
        runId: "customer-intake-modernization",
        manifestVersion: "3.4.1",
        sourceEnvironment: "dev",
        targetEnvironment: "test",
        promotedBy: "Taylor Morgan",
        approvalRequestId: "claims-intake-approval-001",
        notes: null,
        promotedUtc: "2026-01-14T22:06:00.000Z",
      },
    ],
  };
}

describe("GovernanceApprovalLineageDetailContent", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders lineage spine, distinct manifest metrics, signature evidence, and drillable links", () => {
    render(<GovernanceApprovalLineageDetailContent data={sampleLineage()} />);

    expect(screen.getByTestId("approval-lineage-spine")).toBeInTheDocument();
    expect(screen.getByTestId("approval-lineage-version-match-assertion")).toHaveTextContent("Version match: yes");
    expect(screen.queryByText("Unresolved findings")).not.toBeInTheDocument();
    expect(screen.getByText("Compliance gaps")).toBeInTheDocument();

    expect(screen.getByTestId("approval-lineage-manifest-decisionCount-value")).toHaveAttribute(
      "href",
      "/governance/decision-register",
    );
    expect(screen.getByTestId("approval-lineage-manifest-unresolvedIssueCount-value")).toHaveAttribute(
      "href",
      "/governance/findings?runId=customer-intake-modernization&filter=open",
    );
    expect(screen.getByTestId("approval-lineage-manifest-complianceGapCount-value")).toHaveAttribute(
      "href",
      "/governance/findings?runId=customer-intake-modernization&filter=open",
    );

    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText(/Signed by Taylor Morgan/)).toBeInTheDocument();
    expect(screen.getByTestId("approval-lineage-record-digest")).toBeInTheDocument();

    const reviewLink = screen.getByRole("link", { name: /Open architecture review/ });
    expect(reviewLink).toHaveAttribute("href", "/architecture/reviews/customer-intake-modernization");

    const backLink = screen.getByRole("link", { name: "Back to approval request" });
    expect(backLink).toHaveAttribute(
      "href",
      "/governance/approval-queue?runId=customer-intake-modernization#governance-approval-requests",
    );

    const highFinding = screen.getByRole("link", {
      name: "Open finding: Residual PHI minimization risk (monitored)",
    });
    expect(highFinding).toHaveAttribute(
      "href",
      "/architecture/reviews/customer-intake-modernization/findings/sensitive-data-minimization-risk",
    );

    const lowFinding = screen.getByRole("link", { name: "Open finding: Logging retention gap" });
    expect(lowFinding).toHaveAttribute(
      "href",
      "/architecture/reviews/customer-intake-modernization/findings/logging-gap",
    );

    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("uses short help trigger text and breadcrumb hierarchy", () => {
    render(<GovernanceApprovalLineageDetailContent data={sampleLineage()} />);

    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
    expect(screen.getByTestId("approval-lineage-page-breadcrumb")).toHaveTextContent("Governance");
    expect(screen.getByTestId("approval-lineage-page-breadcrumb")).toHaveTextContent("Approval queue");
    expect(screen.getByTestId("approval-lineage-page-breadcrumb")).toHaveTextContent("Approval lineage");
  });
});

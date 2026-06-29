import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ManifestSummary } from "@/types/authority";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { BUYER_MANIFEST_DELIVERABLES_HEADING } from "@/lib/buyer-polish-copy";

import { RunDetailArtifactsExportsSection } from "./RunDetailArtifactsExportsSection";

vi.mock("@/components/FunnelTelemetryExportAnchor", () => ({
  FunnelTelemetryExportAnchor: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/GoldenManifestExportMenu", () => ({
  GoldenManifestExportMenu: () => <div data-testid="golden-manifest-export-menu" />,
}));

vi.mock("@/components/RunScopedAuditExportButton", () => ({
  RunScopedAuditExportButton: ({ runId }: { runId: string }) => (
    <div data-testid="run-scoped-audit-export" data-run-id={runId} />
  ),
}));

const hardInfeasibleVerdict: ManifestFeasibilityVerdict = {
  kind: "HardInfeasible",
  summary: "Required controls cannot be satisfied.",
};

const manifestSummary: ManifestSummary = {
  manifestId: "manifest-1",
  runId: "run-1",
  createdUtc: "2026-06-08T00:00:00Z",
  manifestHash: "hash",
  ruleSetId: "pack",
  ruleSetVersion: "1",
  decisionCount: 0,
  warningCount: 0,
  unresolvedIssueCount: 1,
  status: "Committed",
  feasibilityVerdict: hardInfeasibleVerdict,
};

describe("RunDetailArtifactsExportsSection", () => {
  it("uses Deliverables title and starts expanded in operator shell", () => {
    const { container } = render(
      <RunDetailArtifactsExportsSection
        manifestId="manifest-1"
        runId="run-1"
        buyerPolishedArtifactTable={false}
        artifacts={[]}
        artifactsFailure={null}
        artifactsMalformed={null}
        goldenManifestJsonForExport={null}
        manifestSummaryForUi={manifestSummary}
        manifestSummary={manifestSummary}
        trustEvidenceCard={null}
        samplePolicyPackContextLine={null}
      />,
    );

    expect(screen.getByText(BUYER_MANIFEST_DELIVERABLES_HEADING)).toBeInTheDocument();
    expect(screen.queryByText("Artifacts & exports")).not.toBeInTheDocument();
    expect(container.querySelector("details")).toHaveAttribute("open");
  });

  it("uses Deliverables title and starts collapsed in buyer-polished shell", () => {
    const { container } = render(
      <RunDetailArtifactsExportsSection
        manifestId="manifest-1"
        runId="run-1"
        buyerPolishedArtifactTable
        artifacts={[]}
        artifactsFailure={null}
        artifactsMalformed={null}
        goldenManifestJsonForExport={null}
        manifestSummaryForUi={manifestSummary}
        manifestSummary={manifestSummary}
        trustEvidenceCard={null}
        samplePolicyPackContextLine={null}
      />,
    );

    expect(screen.getByText(BUYER_MANIFEST_DELIVERABLES_HEADING)).toBeInTheDocument();
    expect(container.querySelector("details")).not.toHaveAttribute("open");
  });

  it("surfaces decision receipt in deliverables when verdict is infeasible", () => {
    render(
      <RunDetailArtifactsExportsSection
        manifestId="manifest-1"
        runId="run-1"
        buyerPolishedArtifactTable
        artifacts={[]}
        artifactsFailure={null}
        artifactsMalformed={null}
        goldenManifestJsonForExport={null}
        manifestSummaryForUi={manifestSummary}
        manifestSummary={manifestSummary}
        trustEvidenceCard={null}
        samplePolicyPackContextLine={null}
      />,
    );

    expect(screen.getByText(/decision delivered — design not feasible/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("decision-receipt-export")).toHaveLength(2);
  });

  it("does not surface decision receipt when verdict is feasible", () => {
    const feasibleSummary: ManifestSummary = {
      ...manifestSummary,
      feasibilityVerdict: {
        kind: "Feasible",
        summary: "All required controls satisfied.",
      },
    };

    render(
      <RunDetailArtifactsExportsSection
        manifestId="manifest-1"
        runId="run-1"
        buyerPolishedArtifactTable={false}
        artifacts={[]}
        artifactsFailure={null}
        artifactsMalformed={null}
        goldenManifestJsonForExport={null}
        manifestSummaryForUi={feasibleSummary}
        manifestSummary={feasibleSummary}
        trustEvidenceCard={null}
        samplePolicyPackContextLine={null}
      />,
    );

    expect(screen.queryByTestId("decision-receipt-export")).not.toBeInTheDocument();
    expect(screen.getByText(/wait for the review to commit/i)).toBeInTheDocument();
    expect(screen.getByTestId("run-scoped-audit-export")).toHaveAttribute("data-run-id", "run-1");
  });
});

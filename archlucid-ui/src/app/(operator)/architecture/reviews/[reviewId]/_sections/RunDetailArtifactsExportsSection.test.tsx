import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

import type { ManifestSummary } from "@/types/authority";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { BUYER_MANIFEST_DELIVERABLES_HEADING } from "@/lib/buyer/buyer-polish-copy";

import { RunDetailArtifactsExportsSection } from "./RunDetailArtifactsExportsSection";

vi.mock("@/components/ExportTrackedAnchor", () => ({
  ExportTrackedAnchor: ({
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

vi.mock("@/components/runs/RunScopedAuditExportButton", () => ({
  RunScopedAuditExportButton: ({ runId }: { runId: string }) => (
    <div data-testid="run-scoped-audit-export" data-run-id={runId} />
  ),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

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
      />,
    );

    expect(screen.getByText(BUYER_MANIFEST_DELIVERABLES_HEADING)).toBeInTheDocument();
    expect(screen.queryByText("Artifacts & exports")).not.toBeInTheDocument();
    expect(screen.getByText(/decisions, findings, and supporting evidence for this review/i)).toBeInTheDocument();
    expect(screen.queryByText(/manifest/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download architecture review report (DOCX)" })).toHaveAttribute(
      "href",
      "/api/proxy/v1/runs/run-1/export/docx",
    );
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
      />,
    );

    expect(screen.queryByTestId("decision-receipt-export")).not.toBeInTheDocument();
    expect(screen.getByTestId("run-deliverables-pending-finalize-empty-state")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Finalize this review" })).toHaveAttribute("href", "#finalize-review");
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(screen.getByTestId("run-scoped-audit-export")).toHaveAttribute("data-run-id", "run-1");
  });

  it("demotes pending-finalize deliverables CTA when Do this next owns the page primary", () => {
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
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(screen.getByRole("link", { name: "Finalize this review" }).className).toContain("border-neutral-300");
  });

  it("renders Report problem when deliverables API load fails (TB-791)", () => {
    render(
      <RunDetailArtifactsExportsSection
        manifestId="manifest-1"
        runId="run-1"
        buyerPolishedArtifactTable
        artifacts={[]}
        artifactsFailure={{
          correlationId: "corr-artifacts-503",
          message: "Deliverables list could not be loaded.",
          problem: { title: "Service unavailable", detail: "Try again later." },
          httpStatus: 503,
          retryAfterSeconds: null,
        }}
        artifactsMalformed={null}
        goldenManifestJsonForExport={null}
        manifestSummaryForUi={manifestSummary}
        manifestSummary={manifestSummary}
        trustEvidenceCard={null}
      />,
    );

    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });

  it("renders Report problem when deliverables response is malformed (TB-791)", () => {
    render(
      <RunDetailArtifactsExportsSection
        manifestId="manifest-1"
        runId="run-1"
        buyerPolishedArtifactTable
        artifacts={[]}
        artifactsFailure={null}
        artifactsMalformed="Expected array at items[] but received object."
        goldenManifestJsonForExport={null}
        manifestSummaryForUi={manifestSummary}
        manifestSummary={manifestSummary}
        trustEvidenceCard={null}
      />,
    );

    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });

  it("disables architecture review report download for curated sample reviews", () => {
    render(
      <RunDetailArtifactsExportsSection
        manifestId="manifest-1"
        runId="customer-intake-modernization"
        buyerPolishedArtifactTable
        artifacts={[]}
        artifactsFailure={null}
        artifactsMalformed={null}
        goldenManifestJsonForExport={null}
        manifestSummaryForUi={manifestSummary}
        manifestSummary={manifestSummary}
        trustEvidenceCard={null}
        usedStaticDemoRun
        deliverablesDefaultOpen
      />,
    );

    const download = screen.getByRole("button", { name: "Download architecture review report (DOCX)" });
    expect(download).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Download architecture review report (DOCX)" })).not.toBeInTheDocument();
    expect(
      screen.getByText(/Downloads aren't available for this sample review/i),
    ).toBeInTheDocument();
  });
});

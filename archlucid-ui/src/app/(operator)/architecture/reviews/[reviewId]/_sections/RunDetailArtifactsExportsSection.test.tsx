import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import type { ManifestSummary } from "@/types/authority";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { BUYER_MANIFEST_DELIVERABLES_HEADING } from "@/lib/buyer/buyer-polish-copy";

import { RunDetailArtifactsExportsSection } from "./RunDetailArtifactsExportsSection";

const exportHarness = vi.hoisted(() => {
  const harness: {
    download: ReturnType<typeof vi.fn>;
    reject: ((reason?: unknown) => void) | undefined;
    reset: () => void;
  } = {
    download: vi.fn(),
    reject: undefined,
    reset: () => {
      harness.download.mockClear();
      harness.reject = undefined;
    },
  };

  harness.download.mockImplementation(
    () =>
      new Promise<void>((_resolve, reject) => {
        harness.reject = reject;
      }),
  );

  return harness;
});

const showErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/downloads-blob-trigger-run-export", () => ({
  downloadRunExportZip: exportHarness.download,
}));

vi.mock("@/lib/toast", () => ({
  showError: showErrorMock,
}));

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
    expect(screen.getByRole("button", { name: "Download architecture review report (DOCX)" })).toBeInTheDocument();
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
    expect(screen.getByTestId("run-deliverables-sealed-empty-state")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Finalize this review" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(screen.getByTestId("run-scoped-audit-export")).toHaveAttribute("data-run-id", "run-1");
  });

  it("uses decision-receipt empty for soft infeasible pre-finalize verdict override", () => {
    const softInfeasibleVerdict: ManifestFeasibilityVerdict = {
      kind: "SoftInfeasible",
      summary: "Remediation required before proceed.",
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
        manifestSummaryForUi={null}
        manifestSummary={null}
        trustEvidenceCard={null}
        feasibilityVerdict={softInfeasibleVerdict}
      />,
    );

    expect(screen.getByText(/decision delivered — design not feasible/i)).toBeInTheDocument();
    expect(screen.getByText(/soft infeasible is a bounded envelope decision/i)).toBeInTheDocument();
    expect(screen.queryByTestId("run-deliverables-pending-finalize-empty-state")).not.toBeInTheDocument();
  });

  it("demotes pending-finalize deliverables CTA when Do this next owns the page primary", () => {
    const feasibleSummary: ManifestSummary = {
      ...manifestSummary,
      status: "Draft",
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

    expect(screen.getByRole("link", { name: "Finalize this review" })).toBeInTheDocument();
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

  it("labels missing architecture request JSON without a download button", () => {
    render(
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

    expect(screen.getByTestId("run-detail-architecture-request-json-not-stored")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download Request JSON/i })).not.toBeInTheDocument();
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

  it("does not surface a prior review export failure after navigation", async () => {
    exportHarness.reset();
    showErrorMock.mockClear();

    const { rerender } = render(
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

    fireEvent.click(screen.getByRole("button", { name: "Download review export (ZIP)" }));
    expect(screen.getByRole("button", { name: "Downloading…" })).toBeDisabled();

    rerender(
      <RunDetailArtifactsExportsSection
        manifestId="manifest-2"
        runId="run-2"
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

    exportHarness.reject?.(new Error("prior review export failed"));

    await Promise.resolve();
    await Promise.resolve();
    expect(showErrorMock).not.toHaveBeenCalled();
  });
});

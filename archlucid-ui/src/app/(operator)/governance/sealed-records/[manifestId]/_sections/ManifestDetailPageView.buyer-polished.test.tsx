import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BUYER_MANIFEST_AUTHORITY_SUMMARY } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_SHORT_HELPER_MEASURE_CLASS } from "@/lib/design-tokens";
import {
  SEALED_RECORD_DETAIL_PRIMARY_CONTENT_ID,
  SEALED_RECORD_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/sealed-record-detail-page-copy";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { ManifestSummary } from "@/types/authority";

import { ManifestDetailPageView } from "./ManifestDetailPageView";
import type { ManifestDetailPageSuccessModel } from "./manifest-detail-page-model";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/ManifestDetailSummaryPanel", () => ({
  ManifestDetailSummaryPanel: () => <div data-testid="manifest-summary" />,
}));

vi.mock("@/components/ManifestTopDecisionsCard", () => ({
  ManifestTopDecisionsCard: () => <div data-testid="top-decisions" />,
}));

vi.mock("@/components/ManifestDeliverableGrid", () => ({
  ManifestDeliverableGrid: () => <div data-testid="deliverable-grid" />,
}));

vi.mock("@/components/ManifestBuyerBundleDownloadSection", () => ({
  ManifestBuyerBundleDownloadSection: () => <div data-testid="bundle-download" />,
}));

vi.mock("@/components/ArtifactListTable", () => ({
  ArtifactListTable: () => <div data-testid="artifact-table" />,
}));

vi.mock("@/components/operator/OperatorEvidenceLimitsFooter", () => ({
  OperatorEvidenceLimitsFooter: () => <div data-testid="evidence-footer" />,
}));

const manifestSummary: ManifestSummary = {
  manifestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  runId: "00000000-0000-0000-0000-000000000099",
  createdUtc: "2026-03-20T16:45:00.000Z",
  manifestHash: "sha256-demo-abcdef1234567890abcdef1234567890",
  ruleSetId: "healthcare-claims",
  ruleSetVersion: "2.4.1",
  decisionCount: 3,
  warningCount: 0,
  unresolvedIssueCount: 0,
  status: "Committed",
};

function buildModel(overrides: Partial<ManifestDetailPageSuccessModel> = {}): ManifestDetailPageSuccessModel {
  return {
    manifestId: manifestSummary.manifestId,
    buyerPolishedLayout: true,
    summary: manifestSummary,
    artifacts: [],
    artifactsFailure: null,
    artifactsMalformed: null,
    usedStaticDemoManifest: false,
    manifestFooterExecution: null,
    ...overrides,
  };
}

describe("ManifestDetailPageView buyer polish", () => {
  it("renders skip link, governance breadcrumb, and claim orientation above body", () => {
    render(<ManifestDetailPageView model={buildModel()} />);

    const skipLink = screen.getByRole("link", { name: SEALED_RECORD_DETAIL_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${SEALED_RECORD_DETAIL_PRIMARY_CONTENT_ID}`);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent("Approval");
    expect(breadcrumb).toHaveTextContent("Finalized review records");

    expect(screen.queryByRole("heading", { name: "What this finalized review record is not" })).not.toBeInTheDocument();
    expect(screen.getByTestId("sealed-record-detail-sources")).toBeInTheDocument();

    const orientation = screen.getByTestId("sealed-record-detail-orientation-top");
    const primary = screen.getByTestId("sealed-record-detail-primary-content");
    const summary = screen.getByTestId("manifest-summary");

    expect(primary).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("lets the authority hero use the work-surface width instead of a prose cap", () => {
    render(
      <ManifestDetailPageView
        model={buildModel({
          manifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
          summary: {
            ...manifestSummary,
            manifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
            runId: SHOWCASE_STATIC_DEMO_RUN_ID,
          },
        })}
      />,
    );

    const hero = screen.getByTestId("manifest-buyer-authority-summary");
    expect(screen.getByRole("heading", { name: "What this Finalized review record proves" })).toBeInTheDocument();
    expect(hero.textContent).toContain(BUYER_MANIFEST_AUTHORITY_SUMMARY);
    expect(hero.querySelector("p")).toHaveClass(OPERATOR_SHORT_HELPER_MEASURE_CLASS);
    expect(hero.querySelector("p")?.className).not.toContain("max-w-prose");
  });
});

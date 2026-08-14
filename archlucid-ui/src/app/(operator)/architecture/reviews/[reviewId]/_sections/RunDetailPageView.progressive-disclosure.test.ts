import { describe, expect, it } from "vitest";

import {
  expectSourceContains,
  expectSourceMatches,
  expectSourceNotContains,
  readRegisteredSource,
  requireSourceIndex,
} from "@/testing/source-scan-harness";

const source = readRegisteredSource("run-detail-page-view");
const tabbedWorkspaceSource = readRegisteredSource("run-detail-tabbed-workspace");

describe("RunDetailPageView progressive disclosure", () => {
  it("relies on shell breadcrumbs instead of a page-local breadcrumb trail", () => {
    expectSourceNotContains(source, "<RunDetailBreadcrumb", "run-detail-page-view");
    expectSourceNotContains(source, 'from "./RunDetailBreadcrumb"', "run-detail-page-view");
  });

  it("defers sticky primary actions (no inline sticky actions mount on the composition root)", () => {
    // Sticky chrome was removed from the composition root; keep the marker so a reintroduction is intentional.
    expectSourceContains(source, "stickyActions={null}", "run-detail-page-view");
    expectSourceNotContains(source, "<RunDetailWorkspaceStickyActions", "run-detail-page-view");
  });

  it("prioritizes first-screen proof status in overview tab", () => {
    requireSourceIndex(
      tabbedWorkspaceSource,
      "proofStatusSlot={<RunDetailFirstScreenProofStatusClient",
      "run-detail-tabbed-workspace",
    );
    const belowFoldSource = readRegisteredSource("run-detail-below-fold");

    requireSourceIndex(belowFoldSource, "<RunAgentForensicsSection", "run-detail-below-fold");
  });

  it("places related surfaces rail in a bottom disclosure after primary content", () => {
    expectSourceContains(source, 'data-testid="review-detail-related-surfaces-disclosure"', "run-detail-page-view");
    expectSourceContains(source, '<SignedRecordsReviewDetailVocabularyRail currentSurfaceId="review-detail" />', "run-detail-page-view");
    const disclosureIndex = requireSourceIndex(source, 'data-testid="review-detail-related-surfaces-disclosure"', "run-detail-page-view");
    const workspaceProviderCloseIndex = source.lastIndexOf("</RunDetailWorkspaceDisclosureProvider>");
    const ctoGuardIndex = requireSourceIndex(source, "<RunDetailCtoDemoReviewRouteGuardDeferred", "run-detail-page-view");

    expect(disclosureIndex).toBeGreaterThan(workspaceProviderCloseIndex);
    expect(disclosureIndex).toBeGreaterThan(ctoGuardIndex);
  });

  it("prioritizes workspace header before tabbed workspace mount and summary strip inside tabbed workspace", () => {
    const headerIndex = requireSourceIndex(source, "<RunDetailWorkspaceHeader", "run-detail-page-view");
    const summaryMatch = /<RunDetailWorkspaceSummaryStripDeferred(?:\s|>)/.exec(tabbedWorkspaceSource);
    const summaryIndex = summaryMatch?.index ?? -1;
    const workspaceRenderIndex = requireSourceIndex(source, "{tabbedWorkspaceEl}", "run-detail-page-view");

    expect(summaryIndex).toBeGreaterThan(-1);
    expect(headerIndex).toBeLessThan(workspaceRenderIndex);
    expect(summaryIndex).toBeGreaterThan(-1);
  });

  it("places proof status in overview tab before findings panel", () => {
    const tabbedWorkspaceIndex = requireSourceIndex(
      source,
      "RunDetailTabbedWorkspace",
      "run-detail-page-view",
    );
    const overviewPanelIndex = tabbedWorkspaceSource.indexOf("<RunDetailOverviewPanelClient");
    const findingsPanelIndex = tabbedWorkspaceSource.indexOf("findings: (", overviewPanelIndex);

    expect(overviewPanelIndex).toBeGreaterThan(-1);
    expect(findingsPanelIndex).toBeGreaterThan(-1);
    expect(overviewPanelIndex).toBeLessThan(findingsPanelIndex);
    expectSourceContains(
      tabbedWorkspaceSource,
      "proofStatusSlot={<RunDetailFirstScreenProofStatusClient",
      "run-detail-tabbed-workspace",
    );
    expect(tabbedWorkspaceIndex).toBeGreaterThan(-1);
  });

  it("hides operator forensics and metadata in sponsor mode", () => {
    expectSourceContains(tabbedWorkspaceSource, "{!m.buyerPolishedArtifactTable ? (", "run-detail-tabbed-workspace");
    expectSourceContains(tabbedWorkspaceSource, "RunDetailOperatorTechnicalForensicsPanel", "run-detail-tabbed-workspace");

    const belowFoldSource = readRegisteredSource("run-detail-below-fold");

    expectSourceMatches(
      belowFoldSource,
      /\{!m\.buyerPolishedArtifactTable \? <RunAgentForensicsSection/,
      "run-detail-below-fold",
    );
  });

  it("keeps advanced analysis behind dedicated section", () => {
    const belowFoldSource = readRegisteredSource("run-detail-below-fold");

    expectSourceContains(belowFoldSource, "RunDetailAdvancedAnalysisSection", "run-detail-below-fold");
    expectSourceContains(
      belowFoldSource,
      "RunDetailOperatorPipelineToolsCollapsible",
      "run-detail-below-fold",
    );
  });

  it("wraps operator technical forensics in a default-closed accordion", () => {
    const disclosureSource = readRegisteredSource("run-detail-operator-technical-disclosure");

    expectSourceContains(tabbedWorkspaceSource, "RunDetailOperatorTechnicalForensicsPanel", "run-detail-tabbed-workspace");
    expectSourceContains(
      disclosureSource,
      'data-testid="run-detail-advanced-options"',
      "run-detail-operator-technical-disclosure",
    );
    expectSourceContains(disclosureSource, "defaultOpen={false}", "run-detail-operator-technical-disclosure");
  });

  it("collapses submitted architecture by default", () => {
    const submittedSource = readRegisteredSource("run-detail-submitted-architecture");

    expectSourceContains(
      submittedSource,
      'data-testid="submitted-architecture-collapsible"',
      "run-detail-submitted-architecture",
    );
    expectSourceContains(
      submittedSource,
      "Architecture submitted for review",
      "run-detail-submitted-architecture",
    );
  });

  it("uses tabbed review workspace for standard review detail mode", () => {
    expectSourceContains(source, "RunDetailTabbedWorkspace", "run-detail-page-view");
    expectSourceContains(tabbedWorkspaceSource, "ReviewDetailWorkspace", "run-detail-tabbed-workspace");
    expectSourceContains(tabbedWorkspaceSource, "RunDetailOverviewPanelClient", "run-detail-tabbed-workspace");
    expectSourceContains(source, "tabbedWorkspaceEl", "run-detail-page-view");
    expectSourceContains(tabbedWorkspaceSource, "useStructuredPresentation", "run-detail-tabbed-workspace");
  });

  it("places sponsor context immediately after the decision snapshot in standard review mode", () => {
    const summaryIndex = requireSourceIndex(
      tabbedWorkspaceSource,
      "<RunDetailWorkspaceSummaryStripDeferred",
      "run-detail-tabbed-workspace",
    );
    const executiveAfterSummary = tabbedWorkspaceSource.indexOf("executiveBottomLineEl", summaryIndex);
    const tabbedWorkspaceMountIndex = requireSourceIndex(source, "{tabbedWorkspaceEl}", "run-detail-page-view");

    expect(executiveAfterSummary).toBeGreaterThan(summaryIndex);
    expect(tabbedWorkspaceMountIndex).toBeGreaterThan(-1);
  });

  it("keeps sticky actions to navigation plus one resolved primary action", () => {
    const stickySource = readRegisteredSource("run-detail-workspace-sticky-actions");

    expectSourceNotContains(stickySource, '"Review findings"', "run-detail-workspace-sticky-actions");
    expectSourceNotContains(stickySource, 'label: "Finalize"', "run-detail-workspace-sticky-actions");
    expectSourceContains(stickySource, "<ReviewPackagePrimaryAction", "run-detail-workspace-sticky-actions");
  });
});

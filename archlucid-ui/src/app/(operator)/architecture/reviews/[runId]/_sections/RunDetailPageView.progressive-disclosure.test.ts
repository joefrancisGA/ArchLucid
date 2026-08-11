import { describe, expect, it } from "vitest";

import {
  expectSourceContains,
  expectSourceMatches,
  expectSourceNotContains,
  readRegisteredSource,
  requireSourceIndex,
} from "@/testing/source-scan-harness";

const source = readRegisteredSource("run-detail-page-view");

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
      source,
      "proofStatusSlot={<RunDetailFirstScreenProofStatusClient",
      "run-detail-page-view",
    );
    const belowFoldSource = readRegisteredSource("run-detail-below-fold");

    requireSourceIndex(belowFoldSource, "<RunAgentForensicsSection", "run-detail-below-fold");
  });

  it("prioritizes workspace header and summary before tabbed workspace render", () => {
    const headerIndex = requireSourceIndex(source, "<RunDetailWorkspaceHeader", "run-detail-page-view");
    const summaryMatch = /<RunDetailWorkspaceSummaryStripDeferred(?:\s|>)/.exec(source);
    const summaryIndex = summaryMatch?.index ?? -1;
    const workspaceRenderIndex = requireSourceIndex(source, "{tabbedWorkspaceEl}", "run-detail-page-view");

    expect(summaryIndex).toBeGreaterThan(-1);
    expect(headerIndex).toBeLessThan(summaryIndex);
    expect(summaryIndex).toBeLessThan(workspaceRenderIndex);
  });

  it("places proof status in overview tab before findings panel", () => {
    const tabbedWorkspaceIndex = requireSourceIndex(
      source,
      "const tabbedWorkspaceEl",
      "run-detail-page-view",
    );
    const overviewPanelIndex = source.indexOf("<RunDetailOverviewPanelClient", tabbedWorkspaceIndex);
    const findingsPanelIndex = source.indexOf("findings: (", overviewPanelIndex);

    expect(overviewPanelIndex).toBeGreaterThan(-1);
    expect(findingsPanelIndex).toBeGreaterThan(-1);
    expect(overviewPanelIndex).toBeLessThan(findingsPanelIndex);
    expectSourceContains(
      source,
      "proofStatusSlot={<RunDetailFirstScreenProofStatusClient",
      "run-detail-page-view",
    );
  });

  it("hides operator forensics and metadata in sponsor mode", () => {
    expectSourceContains(source, "{!m.buyerPolishedArtifactTable ? (", "run-detail-page-view");
    expectSourceContains(source, "RunDetailOperatorTechnicalForensicsPanel", "run-detail-page-view");

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

    expectSourceContains(source, "RunDetailOperatorTechnicalForensicsPanel", "run-detail-page-view");
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
    expectSourceContains(source, "ReviewDetailWorkspace", "run-detail-page-view");
    expectSourceContains(source, "RunDetailOverviewPanelClient", "run-detail-page-view");
    expectSourceContains(source, "tabbedWorkspaceEl", "run-detail-page-view");
    expectSourceContains(source, "useStructuredPresentation", "run-detail-page-view");
  });

  it("places executive context immediately after the decision snapshot in standard review mode", () => {
    const summaryIndex = requireSourceIndex(
      source,
      "<RunDetailWorkspaceSummaryStripDeferred",
      "run-detail-page-view",
    );
    const executiveAfterSummary = source.indexOf("executiveBottomLineEl", summaryIndex);
    const tabbedWorkspaceIndex = requireSourceIndex(source, "{tabbedWorkspaceEl}", "run-detail-page-view");

    expect(executiveAfterSummary).toBeGreaterThan(summaryIndex);
    expect(tabbedWorkspaceIndex).toBeGreaterThan(executiveAfterSummary);
  });

  it("keeps sticky actions to navigation plus one resolved primary action", () => {
    const stickySource = readRegisteredSource("run-detail-workspace-sticky-actions");

    expectSourceNotContains(stickySource, '"Review findings"', "run-detail-workspace-sticky-actions");
    expectSourceNotContains(stickySource, 'label: "Finalize"', "run-detail-workspace-sticky-actions");
    expectSourceContains(stickySource, "<ReviewPackagePrimaryAction", "run-detail-workspace-sticky-actions");
  });
});

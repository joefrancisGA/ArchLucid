import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

describe("RunDetailPageView progressive disclosure", () => {
  it("prioritizes first-screen proof status in overview tab", () => {
    const proofIndex = source.indexOf("proofStatusSlot={<RunDetailFirstScreenProofStatusClient");
    const belowFoldSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "RunDetailBelowFoldSections.tsx"),
      "utf8",
    );
    const forensicsIndex = belowFoldSource.indexOf("<RunAgentForensicsSection");

    expect(proofIndex).toBeGreaterThan(-1);
    expect(forensicsIndex).toBeGreaterThan(-1);
  });

  it("prioritizes workspace header and summary before tabbed workspace render", () => {
    const headerIndex = source.indexOf("<RunDetailWorkspaceHeader");
    const summaryMatch = /<RunDetailWorkspaceSummaryStrip(?:\s|>)/.exec(source);
    const summaryIndex = summaryMatch?.index ?? -1;
    const workspaceRenderIndex = source.indexOf("{tabbedWorkspaceEl}");

    expect(headerIndex).toBeGreaterThan(-1);
    expect(summaryIndex).toBeGreaterThan(-1);
    expect(workspaceRenderIndex).toBeGreaterThan(-1);
    expect(headerIndex).toBeLessThan(summaryIndex);
    expect(summaryIndex).toBeLessThan(workspaceRenderIndex);
  });

  it("places proof status in overview tab before findings panel", () => {
    const tabbedWorkspaceIndex = source.indexOf("const tabbedWorkspaceEl");
    const overviewPanelIndex = source.indexOf("<RunDetailOverviewPanelClient", tabbedWorkspaceIndex);
    const findingsPanelIndex = source.indexOf("findings: (", overviewPanelIndex);

    expect(tabbedWorkspaceIndex).toBeGreaterThan(-1);
    expect(overviewPanelIndex).toBeGreaterThan(-1);
    expect(findingsPanelIndex).toBeGreaterThan(-1);
    expect(overviewPanelIndex).toBeLessThan(findingsPanelIndex);
    expect(source).toContain("proofStatusSlot={<RunDetailFirstScreenProofStatusClient");
  });

  it("hides operator forensics and metadata in sponsor mode", () => {
    expect(source).toContain("{!m.buyerPolishedArtifactTable ? (");
    expect(source).toContain("RunDetailOperatorTechnicalForensicsPanel");

    const belowFoldSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "RunDetailBelowFoldSections.tsx"),
      "utf8",
    );

    expect(belowFoldSource).toMatch(
      /\{!m\.buyerPolishedArtifactTable \? <RunAgentForensicsSection/,
    );
  });

  it("keeps advanced analysis behind dedicated section", () => {
    const belowFoldSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "RunDetailBelowFoldSections.tsx"),
      "utf8",
    );

    expect(belowFoldSource).toContain("RunDetailAdvancedAnalysisSection");
    expect(belowFoldSource).toContain("RunDetailOperatorPipelineToolsCollapsible");
  });

  it("wraps operator technical forensics in a default-closed accordion", () => {
    const disclosureSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "RunDetailOperatorTechnicalDisclosure.tsx"),
      "utf8",
    );

    expect(source).toContain("RunDetailOperatorTechnicalForensicsPanel");
    expect(disclosureSource).toContain('data-testid="run-detail-advanced-options"');
    expect(disclosureSource).toContain('defaultOpen={false}');
  });

  it("collapses submitted architecture by default", () => {
    const submittedSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "RunDetailSubmittedArchitectureSection.tsx"),
      "utf8",
    );

    expect(submittedSource).toContain('data-testid="submitted-architecture-collapsible"');
    expect(submittedSource).toContain("Architecture submitted for review");
  });

  it("uses tabbed review workspace for standard review detail mode", () => {
    expect(source).toContain("ReviewDetailWorkspace");
    expect(source).toContain("RunDetailOverviewPanelClient");
    expect(source).toContain("tabbedWorkspaceEl");
    expect(source).toContain("useStructuredPresentation");
  });

  it("uses tabbed architecture workspace for create-architecture handoff", () => {
    expect(source).toContain("ArchitectureCreatedWorkspace");
    expect(source).toContain("showArchitectureCreatedHome");
    expect(source).toContain("fromArchitectureCreation");
    expect(source).toContain("panels={{");
  });
});

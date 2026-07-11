import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

describe("RunDetailPageView progressive disclosure", () => {
  it("prioritizes first-screen proof status before advanced forensics", () => {
    const proofIndex = source.indexOf("<RunDetailFirstScreenProofStatusClient");
    const belowFoldSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "RunDetailBelowFoldSections.tsx"),
      "utf8",
    );
    const forensicsIndex = belowFoldSource.indexOf("<RunAgentForensicsSection");

    expect(proofIndex).toBeGreaterThan(-1);
    expect(forensicsIndex).toBeGreaterThan(-1);
  });

  it("prioritizes workspace header and summary before findings", () => {
    const headerIndex = source.indexOf("<RunDetailWorkspaceHeader");
    const summaryIndex = source.indexOf("<RunDetailWorkspaceSummaryStrip");
    const findingsIndex = source.lastIndexOf("<RunDetailExplanationDeferred");

    expect(headerIndex).toBeGreaterThan(-1);
    expect(summaryIndex).toBeGreaterThan(-1);
    expect(findingsIndex).toBeGreaterThan(-1);
    expect(headerIndex).toBeLessThan(summaryIndex);
    expect(summaryIndex).toBeLessThan(findingsIndex);
  });

  it("places proof status before findings in workspace layout", () => {
    const proofIndex = source.indexOf("<RunDetailFirstScreenProofStatusClient");
    const findingsIndex = source.lastIndexOf("<RunDetailExplanationDeferred");

    expect(proofIndex).toBeGreaterThan(-1);
    expect(findingsIndex).toBeGreaterThan(-1);
    expect(proofIndex).toBeLessThan(findingsIndex);
  });

  it("hides operator forensics and metadata in sponsor mode", () => {
    expect(source).toContain("{!m.buyerPolishedArtifactTable ? (");
    expect(source).toContain("RunDetailOperatorTechnicalDisclosure");
    expect(source).toContain("RunDetailRunMetadataSection");

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

    expect(source).toContain("RunDetailOperatorTechnicalDisclosure");
    expect(source).toContain("RunEstimatedLlmCostCard");
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

  it("uses tabbed architecture workspace for create-architecture handoff", () => {
    expect(source).toContain("ArchitectureCreatedWorkspace");
    expect(source).toContain("showArchitectureCreatedHome");
    expect(source).toContain("fromArchitectureCreation");
    expect(source).toContain("panels={{");
  });
});

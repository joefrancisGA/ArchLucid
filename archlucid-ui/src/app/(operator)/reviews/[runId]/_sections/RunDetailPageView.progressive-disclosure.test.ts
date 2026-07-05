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

  it("places proof status before evidence density strip on committed packages", () => {
    const proofIndex = source.indexOf("<RunDetailFirstScreenProofStatusClient");
    const summaryHeaderSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "ReviewPackageSummaryHeader.tsx"),
      "utf8",
    );
    const evidenceStripIndex = summaryHeaderSource.indexOf("<ReviewPackageEvidenceDensityStrip");
    const findingsIndex = source.indexOf("<RunDetailExplanationDeferred");

    expect(proofIndex).toBeGreaterThan(-1);
    expect(evidenceStripIndex).toBeGreaterThan(-1);
    expect(findingsIndex).toBeGreaterThan(-1);
    expect(source.indexOf("<ReviewPackageSummaryHeader")).toBeLessThan(proofIndex);
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

  it("hides per-finding trace table behind collapsible disclosure", () => {
    const collapsibleSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "RunDetailRunExplanationCollapsible.tsx"),
      "utf8",
    );

    expect(collapsibleSource).toContain("run-finding-explainability-collapsible");
    expect(collapsibleSource).toContain("defaultOpen={false}");
  });
});

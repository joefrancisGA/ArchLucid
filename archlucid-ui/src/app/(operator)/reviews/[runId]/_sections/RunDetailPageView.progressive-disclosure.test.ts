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
    const forensicsIndex = source.indexOf("<RunAgentForensicsSection");

    expect(proofIndex).toBeGreaterThan(-1);
    expect(forensicsIndex).toBeGreaterThan(proofIndex);
  });

  it("hides operator forensics and metadata in sponsor mode", () => {
    expect(source).toContain("{!m.buyerPolishedArtifactTable ? (");
    expect(source).toMatch(
      /\{!m\.buyerPolishedArtifactTable \?\s*\(\s*\n\s*<RunDetailRunMetadataSection/,
    );
    expect(source).toMatch(
      /\{!m\.buyerPolishedArtifactTable \? <RunAgentForensicsSection/,
    );
  });

  it("keeps advanced analysis behind dedicated section", () => {
    expect(source).toContain("RunDetailAdvancedAnalysisSection");
    expect(source).toContain("RunDetailOperatorPipelineToolsCollapsible");
  });
});

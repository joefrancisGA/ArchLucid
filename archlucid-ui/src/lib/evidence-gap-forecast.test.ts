import { describe, expect, it } from "vitest";

import {
  deriveEvidenceGapForecast,
  deriveEvidencePresenceFromFileNames,
  deriveEvidencePresenceFromInventoryKinds,
  EVIDENCE_COVERAGE_CLASS_COUNT,
  formatEvidenceGapForecastHeadline,
  listEvidenceCoverageReferenceRows,
  summarizeEvidenceCoverage,
  type EvidencePresenceFlags,
} from "@/lib/evidence-gap-forecast";

const NO_EVIDENCE: EvidencePresenceFlags = {
  hasArchitectureBrief: false,
  hasCloudInventory: false,
  hasInfrastructureAsCode: false,
  hasArchitectureDiagram: false,
  hasOperationalEvidence: false,
};

const ALL_EVIDENCE: EvidencePresenceFlags = {
  hasArchitectureBrief: true,
  hasCloudInventory: true,
  hasInfrastructureAsCode: true,
  hasArchitectureDiagram: true,
  hasOperationalEvidence: true,
};

describe("deriveEvidenceGapForecast", () => {
  it("maps each missing evidence class to expected thinner domains", () => {
    const forecast = deriveEvidenceGapForecast({
      hasArchitectureBrief: false,
      hasCloudInventory: false,
      hasInfrastructureAsCode: true,
      hasArchitectureDiagram: true,
      hasOperationalEvidence: true,
    });

    expect(forecast.map((entry) => entry.missingClass)).toEqual(["architecture-brief", "cloud-inventory"]);
    expect(forecast[0]?.thinnerDomains).toContain("decisions");
    expect(forecast[1]?.thinnerDomains).toContain("cost");
  });

  it("returns no forecast when all evidence classes are present", () => {
    const forecast = deriveEvidenceGapForecast({
      hasArchitectureBrief: true,
      hasCloudInventory: true,
      hasInfrastructureAsCode: true,
      hasArchitectureDiagram: true,
      hasOperationalEvidence: true,
    });

    expect(forecast).toHaveLength(0);
  });

  it("uses buyer-safe copy without pipeline jargon", () => {
    const forecast = deriveEvidenceGapForecast({
      hasArchitectureBrief: false,
      hasCloudInventory: false,
      hasInfrastructureAsCode: false,
      hasArchitectureDiagram: false,
      hasOperationalEvidence: false,
    });

    for (const entry of forecast) {
      const headline = formatEvidenceGapForecastHeadline(entry);

      expect(headline.toLowerCase()).not.toContain("pipeline");
      expect(headline.toLowerCase()).not.toContain("execute");
      expect(headline.toLowerCase()).not.toContain("agent");
    }
  });
});

describe("summarizeEvidenceCoverage", () => {
  it("counts present classes and unions the thinner domains into one line", () => {
    const summary = summarizeEvidenceCoverage({
      ...ALL_EVIDENCE,
      hasCloudInventory: false,
    });

    expect(summary.presentCount).toBe(EVIDENCE_COVERAGE_CLASS_COUNT - 1);
    expect(summary.missingCount).toBe(1);
    expect(summary.thinnerDomains).toEqual(["cost", "resilience", "security"]);
    expect(summary.summaryLine).toBe(
      "4 of 5 evidence classes present — expect thinner cost, resilience, and security findings.",
    );
  });

  it("orders domains canonically rather than by which class is missing", () => {
    const summary = summarizeEvidenceCoverage({
      ...ALL_EVIDENCE,
      hasArchitectureBrief: false,
      hasOperationalEvidence: false,
    });

    expect(summary.thinnerDomains).toEqual(["resilience", "security", "decisions"]);
  });

  it("reports no gaps when every evidence class is present", () => {
    const summary = summarizeEvidenceCoverage(ALL_EVIDENCE);

    expect(summary.missingCount).toBe(0);
    expect(summary.thinnerDomains).toEqual([]);
    expect(summary.summaryLine).toBe("All 5 evidence classes present — no expected coverage gaps.");
  });

  it("degrades to every class missing without duplicating domains", () => {
    const summary = summarizeEvidenceCoverage(NO_EVIDENCE);

    expect(summary.presentCount).toBe(0);
    expect(summary.thinnerDomains).toEqual(["cost", "resilience", "security", "decisions"]);
  });
});

describe("listEvidenceCoverageReferenceRows", () => {
  it("covers every evidence class in a stable order for the help table", () => {
    const rows = listEvidenceCoverageReferenceRows();

    expect(rows).toHaveLength(EVIDENCE_COVERAGE_CLASS_COUNT);
    expect(rows.map((row) => row.classId)).toEqual([
      "architecture-brief",
      "cloud-inventory",
      "infrastructure-as-code",
      "architecture-diagram",
      "operational-evidence",
    ]);
  });

  it("reuses the same guidance the in-product forecast shows", () => {
    const rows = listEvidenceCoverageReferenceRows();
    const forecast = deriveEvidenceGapForecast(NO_EVIDENCE);

    expect(rows.map((row) => row.guidance)).toEqual(forecast.map((entry) => entry.guidance));
  });
});

describe("deriveEvidencePresenceFromFileNames", () => {
  it("classifies upload file names into evidence classes", () => {
    const presence = deriveEvidencePresenceFromFileNames([
      "prod-inventory.zip",
      "main.tf",
      "architecture-brief.md",
    ]);

    expect(presence.hasCloudInventory).toBe(true);
    expect(presence.hasInfrastructureAsCode).toBe(true);
    expect(presence.hasArchitectureBrief).toBe(true);
    expect(presence.hasArchitectureDiagram).toBe(false);
  });
});

describe("deriveEvidencePresenceFromInventoryKinds", () => {
  it("detects architecture brief from submitted text flag", () => {
    const presence = deriveEvidencePresenceFromInventoryKinds({
      inventoryKinds: ["Submitted evidence"],
      submittedArchitecturePresent: true,
    });

    expect(presence.hasArchitectureBrief).toBe(true);
  });
});

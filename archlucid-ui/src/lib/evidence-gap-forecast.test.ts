import { describe, expect, it } from "vitest";

import {
  deriveEvidenceGapForecast,
  deriveEvidencePresenceFromFileNames,
  deriveEvidencePresenceFromInventoryKinds,
  formatEvidenceGapForecastHeadline,
} from "@/lib/evidence-gap-forecast";

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

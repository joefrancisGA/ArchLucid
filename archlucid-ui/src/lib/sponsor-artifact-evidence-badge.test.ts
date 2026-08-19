import { describe, expect, it } from "vitest";

import { resolveSponsorArtifactEvidenceBadges } from "@/lib/sponsor-artifact-evidence-badge";

describe("resolveSponsorArtifactEvidenceBadges", () => {
  it("marks demo tenants as demo-derived and warns before sponsor send", () => {
    const badges = resolveSponsorArtifactEvidenceBadges({
      isDemoTenant: true,
      costEvidenceFreshnessStatus: "Fresh",
    });

    expect(badges.source).toBe("demo-derived");
    expect(badges.warnBeforeSponsorSend).toBe(true);
  });

  it("maps uploaded actual pricing basis to uploaded-actual-amortized", () => {
    const badges = resolveSponsorArtifactEvidenceBadges({
      savingsPricingBasis: "Uploaded actual/amortized",
      costEvidenceFreshnessStatus: "Fresh",
    });

    expect(badges.source).toBe("uploaded-actual-amortized");
    expect(badges.freshness).toBe("fresh");
    expect(badges.warnBeforeSponsorSend).toBe(false);
  });

  it("warns when cost evidence freshness is stale or missing", () => {
    expect(
      resolveSponsorArtifactEvidenceBadges({
        savingsPricingBasis: "Retail",
        costEvidenceFreshnessStatus: "Stale",
      }).warnBeforeSponsorSend,
    ).toBe(true);

    expect(
      resolveSponsorArtifactEvidenceBadges({
        savingsPricingBasis: "Retail",
        costEvidenceFreshnessStatus: "Missing",
      }).freshness,
    ).toBe("missing");
  });

  it("maps heuristic fallback and retail catalog sources", () => {
    expect(
      resolveSponsorArtifactEvidenceBadges({
        savingsPricingBasis: "Heuristic fallback",
        costEvidenceFreshnessStatus: "Fresh",
      }).source,
    ).toBe("heuristic-fallback");

    expect(
      resolveSponsorArtifactEvidenceBadges({
        savingsPricingBasis: "Retail",
        costEvidenceFreshnessStatus: "Fresh",
      }).source,
    ).toBe("azure-retail");
  });
});

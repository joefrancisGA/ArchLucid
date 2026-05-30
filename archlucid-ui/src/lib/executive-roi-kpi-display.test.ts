import { describe, expect, it } from "vitest";

import { presentCostEvidenceFreshness, presentExecutiveKpiCount } from "@/lib/executive-roi-kpi-display";

describe("presentExecutiveKpiCount", () => {
  it("returns em dash for missing values", () => {
    const result = presentExecutiveKpiCount(undefined, { loading: false });

    expect(result.display).toBe("—");
    expect(result.state).toBe("missing");
  });

  it("distinguishes zero from missing", () => {
    const result = presentExecutiveKpiCount(0, { loading: false });

    expect(result.display).toBe("0");
    expect(result.state).toBe("zero");
  });

  it("formats finite counts", () => {
    const result = presentExecutiveKpiCount(1284, { loading: false });

    expect(result.display).toBe("1,284");
    expect(result.state).toBe("value");
  });
});

describe("presentCostEvidenceFreshness", () => {
  it("marks demo-derived pricing basis", () => {
    const result = presentCostEvidenceFreshness({
      loading: false,
      status: "Fresh",
      savingsPricingBasis: "Illustrative demo pricing",
      staleAfterDays: 30,
    });

    expect(result.state).toBe("demo-derived");
    expect(result.display).toBe("Demo-derived");
  });

  it("links stale evidence to Azure extractor runbook", () => {
    const result = presentCostEvidenceFreshness({
      loading: false,
      status: "Stale",
      savingsPricingBasis: "Measured",
      staleAfterDays: 14,
    });

    expect(result.state).toBe("stale");
    expect(result.runbookHref).toContain("AZURE_EXTRACTOR_UPLOAD");
  });

  it("returns unavailable when status missing", () => {
    const result = presentCostEvidenceFreshness({
      loading: false,
      status: undefined,
      savingsPricingBasis: undefined,
      staleAfterDays: undefined,
    });

    expect(result.state).toBe("missing");
    expect(result.display).toBe("Unavailable");
  });
});

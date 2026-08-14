import { describe, expect, it } from "vitest";
import { unzipSync } from "fflate";

import {
  AZURE_EXTRACTOR_DEMO_SCENARIO_IDS,
  DEFAULT_DEMO_REVIEW_SCENARIO_ID,
  buildWizardPrefillFromDemoScenario,
  createAzureExtractorDemoZipFile,
  getAzureExtractorDemoScenario,
  getAzureExtractorDemoZipBytes,
  resolveAzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { readArchLucidAzurePackageZipFromBytes } from "@/lib/read-arch-lucid-azure-package-zip";

describe("arch-lucid-azure-extractor-demo-scenarios", () => {
  it("exports cloud-agnostic demo review scenario aliases", () => {
    expect(DEFAULT_DEMO_REVIEW_SCENARIO_ID).toBe("customer-intake-modernization");
  });

  it("ships three complex bundled demo scenarios", () => {
    expect(AZURE_EXTRACTOR_DEMO_SCENARIO_IDS).toHaveLength(3);

    for (const scenarioId of AZURE_EXTRACTOR_DEMO_SCENARIO_IDS) {
      const scenario = getAzureExtractorDemoScenario(scenarioId);
      expect(scenario.buildResources().length).toBeGreaterThanOrEqual(20);
    }
  });

  it("builds valid packager ZIPs with manifest and resources", () => {
    for (const scenarioId of AZURE_EXTRACTOR_DEMO_SCENARIO_IDS) {
      const result = readArchLucidAzurePackageZipFromBytes(getAzureExtractorDemoZipBytes(scenarioId));

      expect(result.ok).toBe(true);

      const entries = unzipSync(getAzureExtractorDemoZipBytes(scenarioId));
      expect(entries["manifest.json"]).toBeDefined();
      expect(entries["resources.json"]).toBeDefined();
      expect(entries["policy-compliance.json"]).toBeDefined();
      expect(entries["architecture-diagram.mmd"]).toBeDefined();
    }
  });

  it("prefills wizard identity from scenario metadata", () => {
    const scenario = getAzureExtractorDemoScenario("customer-intake-modernization");
    const prefill = buildWizardPrefillFromDemoScenario(scenario);

    expect(prefill.systemName).toBe("ClaimsIntakeRg");
    expect(prefill.description).toContain("Demo Azure extractor package");
  });

  it("resolves query aliases to known scenario ids", () => {
    expect(resolveAzureExtractorDemoScenarioId("multi-region-saas-platform")).toBe(
      "multi-region-saas-platform",
    );
    expect(resolveAzureExtractorDemoScenarioId("unknown")).toBe("customer-intake-modernization");
  });

  it("creates upload-ready demo zip files", () => {
    const file = createAzureExtractorDemoZipFile("finops-optimization-snapshot");

    expect(file.name).toContain("finops");
    expect(file.size).toBeGreaterThan(0);
  });
});

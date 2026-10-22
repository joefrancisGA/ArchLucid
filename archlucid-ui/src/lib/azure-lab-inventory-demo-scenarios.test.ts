import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";

import {
  AZURE_LAB_DEMO_SCENARIO_IDS,
  getAzureLabDemoScenario,
  getAzureLabDemoZipBytes,
  isAzureLabDemoScenarioId,
  listAzureLabDemoScenarioSummaries,
} from "@/lib/azure-lab-inventory-demo-scenarios";
import { readArchLucidAzurePackageZipFromBytes } from "@/lib/read-arch-lucid-azure-package-zip";

describe("azure lab inventory demo scenarios", () => {
  it("lists without building and caches valid reader-compatible ZIPs", () => {
    const summaries = listAzureLabDemoScenarioSummaries();

    expect(summaries.map((summary) => summary.id)).toEqual([...AZURE_LAB_DEMO_SCENARIO_IDS]);
    expect(summaries.map((summary) => summary.resourceCount)).toEqual([500, 500, 50]);

    for (const scenarioId of AZURE_LAB_DEMO_SCENARIO_IDS) {
      const first = getAzureLabDemoZipBytes(scenarioId);
      const second = getAzureLabDemoZipBytes(scenarioId);
      const entries = unzipSync(first);
      const resources = JSON.parse(strFromU8(entries["resources.json"] ?? new Uint8Array())) as Array<Record<string, unknown>>;
      const validation = readArchLucidAzurePackageZipFromBytes(first);

      expect(first).toBe(second);
      expect(resources).toHaveLength(getAzureLabDemoScenario(scenarioId).resourceCount);
      expect(resources[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String), resourceType: expect.any(String) }));
      expect(validation.ok).toBe(true);
    }
  });

  it("labels the expected edge cases in the lab package", () => {
    const entries = unzipSync(getAzureLabDemoZipBytes("azure-lab-messy-estate"));
    const resources = JSON.parse(strFromU8(entries["resources.json"] ?? new Uint8Array())) as Array<{ id: string }>;
    const policy = JSON.parse(strFromU8(entries["policy-compliance.json"] ?? new Uint8Array())) as { states: Array<{ resourceId: string }> };
    const readme = strFromU8(entries["README.txt"] ?? new Uint8Array());

    expect(policy.states[0]?.resourceId).not.toBeUndefined();
    expect(resources.some((resource) => resource.id === policy.states[0]?.resourceId)).toBe(false);
    expect(readme).toContain("Expected to look incomplete.");
  });

  it("recognizes only lab scenario ids", () => {
    expect(isAzureLabDemoScenarioId("azure-lab-landing-zone")).toBe(true);
    expect(isAzureLabDemoScenarioId("customer-intake-modernization")).toBe(false);
    expect(isAzureLabDemoScenarioId(undefined)).toBe(false);
  });
});

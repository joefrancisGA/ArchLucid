import { describe, expect, it } from "vitest";

import {
  extractUploadDemoScenarioHrefFromSearch,
  parseExtractUploadDemoScenarioFromSearch,
} from "@/lib/administration/extract-upload-demo-scenario-url";

describe("extract upload demo scenario URL", () => {
  it("parses showcase and lab ids while rejecting unknown values", () => {
    expect(parseExtractUploadDemoScenarioFromSearch("customer-intake-modernization")).toBe(
      "customer-intake-modernization",
    );
    expect(parseExtractUploadDemoScenarioFromSearch("azure-lab-landing-zone")).toBe("azure-lab-landing-zone");
    expect(parseExtractUploadDemoScenarioFromSearch("unknown")).toBeNull();
  });

  it("preserves other query parameters for lab selections", () => {
    expect(
      extractUploadDemoScenarioHrefFromSearch("runId=abc", "azure-lab-messy-estate"),
    ).toBe("/administration/extract-upload?runId=abc&demoScenario=azure-lab-messy-estate");
  });
});

import { describe, expect, it } from "vitest";

import {
  buildTrialSampleAzurePortalDeployUrl,
  resolveTrialSampleAzureTemplateUrl,
  TRIAL_SAMPLE_AZURE_TEMPLATE_PATH,
} from "@/lib/trial-sample-azure-deploy";

describe("trial-sample-azure-deploy", () => {
  it("builds portal create link with encoded template uri", () => {
    const url = buildTrialSampleAzurePortalDeployUrl("https://app.example.com/trial-sample-azure-template.json");

    expect(url).toMatch(/^https:\/\/portal\.azure\.com\/#create\/Microsoft\.Template\/uri\//);
    expect(url).toContain(encodeURIComponent("https://app.example.com/trial-sample-azure-template.json"));
  });

  it("resolves template path from origin", () => {
    expect(resolveTrialSampleAzureTemplateUrl("https://app.example.com/")).toBe(
      `https://app.example.com${TRIAL_SAMPLE_AZURE_TEMPLATE_PATH}`,
    );
  });
});

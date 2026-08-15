import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { AZURE_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/azure-cloud-connection-copy";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const AZURE_CLOUD_CONNECTION_BAND_TEST_FILES = [
  "src/lib/azure-cloud-connection-copy.test.ts",
  "src/app/(operator)/integrations/cloud-connections/_sections/AzureCloudConnectionDetailClient.test.tsx",
  "src/app/(operator)/integrations/cloud-connections/_sections/AzureConnectionLivePanels.test.tsx",
  "src/app/(operator)/integrations/cloud-connections/_sections/AzureConnectionDetailsPanel.test.tsx",
  "src/app/(operator)/integrations/cloud-connections/_sections/AzureConnectionRecentActivityPanel.test.tsx",
  "src/lib/operator/operator-integrations-page-help-surfaces.test.ts",
] as const;

describe("azure cloud connection band regression (TB-1770)", () => {
  it("keeps sibling Vitest guards for TB-1766 through TB-1769 on disk", () => {
    for (const relativePath of AZURE_CLOUD_CONNECTION_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps banned Tier/hosted-pull jargon list for Azure product surfaces (TB-1766)", () => {
    expect(AZURE_CLOUD_CONNECTION_BANNED_COPY.length).toBeGreaterThan(0);
    expect(AZURE_CLOUD_CONNECTION_BANNED_COPY).toContain("Tier 2");
    expect(AZURE_CLOUD_CONNECTION_BANNED_COPY).toContain("hosted poll");
  });

  it("tracks Azure cloud detail on IAZ traffic row", () => {
    const iaz = findUiRouteTrafficRow("IAZ");

    expect(iaz).toBeDefined();
    expect(iaz?.path).toBe("/integrations/cloud-connections/azure");
    expect(iaz?.section).toBe("Integrations");
    expect(iaz?.note).toContain("AzureCloudConnectionDetailClient");
  });
});

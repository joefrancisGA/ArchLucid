import { describe, expect, it } from "vitest";

import type { CloudPlatformScope } from "@/lib/cloud-platform-scope-storage";
import {
  architectureCloudConnectionsHelpSubtitle,
  architectureCloudConnectionsHubContextualLead,
  architectureCloudConnectionsSummary,
  cloudConnectionsHelpSubtitleForProductLine,
  cloudConnectionsHubContextualLeadForProductLine,
  cloudConnectionsSummaryForProductLine,
  effectiveCloudPlatformScopeForProductLine,
  filterCloudProvidersForProductLine,
  isCloudConnectionPathExcludedForProductLine,
  isCloudProviderSupportedForProductLine,
  isHelpSearchTopicExcludedForProductLine,
  isHelpTopicExcludedForProductLine,
  secureNowCloudConnectionsHelpSubtitle,
  secureNowCloudConnectionsHubContextualLead,
  secureNowCloudConnectionsSummary,
} from "@/lib/product-line/securenow-cloud-platform-policy";

describe("securenow-cloud-platform-policy", () => {
  it("limits SecureNow to Azure cloud providers", () => {
    expect(isCloudProviderSupportedForProductLine("azure", "security")).toBe(true);
    expect(isCloudProviderSupportedForProductLine("aws", "security")).toBe(false);
    expect(isCloudProviderSupportedForProductLine("gcp", "security")).toBe(false);
    expect(isCloudProviderSupportedForProductLine("aws", "architecture")).toBe(true);
    expect(filterCloudProvidersForProductLine(["aws", "azure", "gcp"], "security")).toEqual(["azure"]);
  });

  it("excludes AWS and GCP help topics and search entries for SecureNow", () => {
    expect(isHelpTopicExcludedForProductLine("cloud-connections-aws", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("cloud-connections-gcp", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("cloud-connections-azure", "security")).toBe(false);
    expect(isHelpSearchTopicExcludedForProductLine("connect-aws", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("connect-gcp", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("connect-azure", "security")).toBe(false);
  });

  it("blocks AWS and GCP integration routes in the Security shell", () => {
    expect(
      isCloudConnectionPathExcludedForProductLine("/integrations/cloud-connections/aws", "security"),
    ).toBe(true);
    expect(
      isCloudConnectionPathExcludedForProductLine("/integrations/cloud-connections/gcp", "security"),
    ).toBe(true);
    expect(
      isCloudConnectionPathExcludedForProductLine("/integrations/cloud-connections/azure", "security"),
    ).toBe(false);
    expect(
      isCloudConnectionPathExcludedForProductLine("/integrations/cloud-connections/aws", "architecture"),
    ).toBe(false);
  });

  it("forces Azure-only platform scope for SecureNow", () => {
    const scope: CloudPlatformScope = {
      "evidence-only": true,
      azure: false,
      aws: true,
      gcp: true,
    };

    expect(effectiveCloudPlatformScopeForProductLine(scope, "security")).toEqual({
      "evidence-only": true,
      azure: true,
      aws: false,
      gcp: false,
    });
    expect(effectiveCloudPlatformScopeForProductLine(scope, "architecture")).toEqual(scope);
  });

  it("uses Azure-only SecureNow copy and multicloud Architecture copy", () => {
    expect(secureNowCloudConnectionsSummary()).toContain("Azure");
    expect(secureNowCloudConnectionsSummary()).not.toMatch(/\bAWS\b|\bGCP\b/i);
    expect(architectureCloudConnectionsSummary()).toMatch(/Azure, AWS, or GCP/);
    expect(cloudConnectionsSummaryForProductLine("security")).toBe(secureNowCloudConnectionsSummary());
    expect(cloudConnectionsSummaryForProductLine("architecture")).toBe(architectureCloudConnectionsSummary());
    expect(secureNowCloudConnectionsHelpSubtitle()).not.toMatch(/\bAWS\b|\bGCP\b/i);
    expect(architectureCloudConnectionsHelpSubtitle()).toMatch(/AWS/);
    expect(cloudConnectionsHelpSubtitleForProductLine("security")).toBe(secureNowCloudConnectionsHelpSubtitle());
    expect(secureNowCloudConnectionsHubContextualLead()).not.toMatch(/\bAWS\b|Google Cloud/i);
    expect(architectureCloudConnectionsHubContextualLead()).toMatch(/Google Cloud/);
    expect(cloudConnectionsHubContextualLeadForProductLine("security")).toBe(
      secureNowCloudConnectionsHubContextualLead(),
    );
  });
});

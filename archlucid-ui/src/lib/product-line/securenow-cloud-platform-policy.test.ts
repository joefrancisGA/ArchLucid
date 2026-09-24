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
  isIntegrationConnectorExcludedForProductLine,
  isIntegrationPathExcludedForProductLine,
  isCloudProviderSupportedForProductLine,
  isHelpSearchTopicExcludedForProductLine,
  isHelpTopicExcludedForProductLine,
  isSecureNowDemoChromeExcluded,
  isSecureNowTrainingChromeExcluded,
  isSecureNowWorkspaceFooterTrustLinkExcluded,
  secureNowCloudConnectionsHelpSubtitle,
  secureNowCloudConnectionsHubContextualLead,
  secureNowCloudConnectionsSummary,
  secureNowCloudInventoryEvidenceSummary,
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

  it("excludes architecture-process and billing help from SecureNow", () => {
    expect(isHelpTopicExcludedForProductLine("billing-and-plans", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("first-architecture-review", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("evidence-intake", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("review-packages", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("review-guide", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("choose-your-next-step", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("accelerator-chooser", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("career-rehearsal-doors", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("career-vs-rehearsal", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("architecture-draft-editing", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("architecture-sharing", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("inspect-stored-evidence", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("inspect-stored-evidence", "architecture")).toBe(false);
    expect(isHelpTopicExcludedForProductLine("slack-integration", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("system-gravity", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("inhabit-the-architecture", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("sketch-a-change", "security")).toBe(true);
    expect(isHelpTopicExcludedForProductLine("system-gravity", "architecture")).toBe(false);
    expect(isHelpTopicExcludedForProductLine("findings", "security")).toBe(false);
    expect(isHelpTopicExcludedForProductLine("security-evidence-paths", "security")).toBe(false);
    expect(isHelpTopicExcludedForProductLine("security-evidence-paths", "architecture")).toBe(false);
    expect(isHelpTopicExcludedForProductLine("billing-and-plans", "architecture")).toBe(false);
    expect(isHelpSearchTopicExcludedForProductLine("first-review-guide", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("first-review-guide", "architecture")).toBe(false);
    expect(isHelpSearchTopicExcludedForProductLine("create-first-review", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("how-archlucid-works", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("career-rehearsal-doors", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("career-vs-rehearsal", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("system-gravity", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("inhabit-the-architecture", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("sketch-a-change", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("system-gravity", "architecture")).toBe(false);
  });

  it("excludes ArchLucid training and simulator chrome from SecureNow", () => {
    expect(isSecureNowTrainingChromeExcluded("security")).toBe(true);
    expect(isSecureNowTrainingChromeExcluded("architecture")).toBe(false);
  });

  it("excludes ArchLucid demo and sample chrome from SecureNow", () => {
    expect(isSecureNowDemoChromeExcluded("security")).toBe(true);
    expect(isSecureNowDemoChromeExcluded("architecture")).toBe(false);
  });

  it("excludes the workspace footer Security and trust link from SecureNow", () => {
    expect(isSecureNowWorkspaceFooterTrustLinkExcluded("security")).toBe(true);
    expect(isSecureNowWorkspaceFooterTrustLinkExcluded("architecture")).toBe(false);
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

  it("keeps Slack and Azure Boards out of SecureNow integration surfaces", () => {
    expect(isIntegrationConnectorExcludedForProductLine("slack", "security")).toBe(true);
    expect(isIntegrationConnectorExcludedForProductLine("azureBoards", "security")).toBe(true);
    expect(isIntegrationConnectorExcludedForProductLine("slack", "architecture")).toBe(false);
    expect(isIntegrationConnectorExcludedForProductLine("teams", "security")).toBe(false);
    expect(isIntegrationPathExcludedForProductLine("/integrations/slack", "security")).toBe(true);
    expect(isIntegrationPathExcludedForProductLine("/integrations/azure-boards", "security")).toBe(true);
    expect(isIntegrationPathExcludedForProductLine("/help/slack-integration", "security")).toBe(true);
    expect(isIntegrationPathExcludedForProductLine("/integrations/teams", "security")).toBe(false);
    expect(isIntegrationPathExcludedForProductLine("/integrations/slack", "architecture")).toBe(false);
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
    expect(secureNowCloudInventoryEvidenceSummary()).toContain("Azure");
    expect(secureNowCloudInventoryEvidenceSummary()).not.toMatch(/\bAWS\b|\bGCP\b/i);
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

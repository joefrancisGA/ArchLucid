import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip", () => ({
  HelpConnectionStatusWorkspaceReadinessStrip: () => null,
}));

import { HelpApiKeysGuideView } from "@/app/(operator)/help/_sections/HelpApiKeysGuideView";
import { HelpAiUsageGuideView } from "@/app/(operator)/help/_sections/HelpAiUsageGuideView";
import { HelpArchitectureDraftsGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureDraftsGuideView";
import { HelpArchitectureScorecardGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureScorecardGuideView";
import { HelpBaselineSettingsGuideView } from "@/app/(operator)/help/_sections/HelpBaselineSettingsGuideView";
import { HelpConnectionStatusGuideView } from "@/app/(operator)/help/_sections/HelpConnectionStatusGuideView";
import { HelpDecisionRegisterGuideView } from "@/app/(operator)/help/_sections/HelpDecisionRegisterGuideView";
import { HelpImprovementPlanningGuideView } from "@/app/(operator)/help/_sections/HelpImprovementPlanningGuideView";
import { HelpImpactPreviewGuideView } from "@/app/(operator)/help/_sections/HelpImpactPreviewGuideView";
import { HelpAdvisoryScansGuideView } from "@/app/(operator)/help/_sections/HelpAdvisoryScansGuideView";
import { HelpEvidenceGraphGuideView } from "@/app/(operator)/help/_sections/HelpEvidenceGraphGuideView";
import { HelpArchitectureIntelligenceGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureIntelligenceGuideView";
import { HelpSearchReviewEvidenceGuideView } from "@/app/(operator)/help/_sections/HelpSearchReviewEvidenceGuideView";
import { HelpJiraIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpJiraIntegrationGuideView";
import { HelpModelGovernanceGuideView } from "@/app/(operator)/help/_sections/HelpModelGovernanceGuideView";
import { HelpNotificationsGuideView } from "@/app/(operator)/help/_sections/HelpNotificationsGuideView";
import { HelpPreferencesGuideView } from "@/app/(operator)/help/_sections/HelpPreferencesGuideView";
import { HelpServiceNowIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpServiceNowIntegrationGuideView";
import { HelpSlackIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpSlackIntegrationGuideView";
import { HelpSponsorDashboardGuideView } from "@/app/(operator)/help/_sections/HelpSponsorDashboardGuideView";
import { HelpStandardsRulesGuideView } from "@/app/(operator)/help/_sections/HelpStandardsRulesGuideView";
import { HelpSystemHealthGuideView } from "@/app/(operator)/help/_sections/HelpSystemHealthGuideView";
import { HelpTeamsIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpTeamsIntegrationGuideView";
import { HelpWebhooksIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpWebhooksIntegrationGuideView";
import { HelpWorkspaceSettingsGuideView } from "@/app/(operator)/help/_sections/HelpWorkspaceSettingsGuideView";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("specialty help guides — operator surfaces batch", () => {
  it.each([
    ["architecture-scorecard", HelpArchitectureScorecardGuideView, "help-architecture-scorecard-guide"],
    ["connection-status", HelpConnectionStatusGuideView, "help-connection-status-guide"],
    ["decision-register", HelpDecisionRegisterGuideView, "help-decision-register-guide"],
    ["improvement-planning", HelpImprovementPlanningGuideView, "help-improvement-planning-guide"],
    ["impact-preview", HelpImpactPreviewGuideView, "help-impact-preview-guide"],
    ["advisory-scans", HelpAdvisoryScansGuideView, "help-advisory-scans-guide"],
    ["standards-and-rules", HelpStandardsRulesGuideView, "help-standards-rules-guide"],
    ["baseline-settings", HelpBaselineSettingsGuideView, "help-baseline-settings-guide"],
    ["slack-integration", HelpSlackIntegrationGuideView, "help-slack-integration-guide"],
    ["teams-integration", HelpTeamsIntegrationGuideView, "help-teams-integration-guide"],
    ["webhooks-integration", HelpWebhooksIntegrationGuideView, "help-webhooks-integration-guide"],
    ["api-keys", HelpApiKeysGuideView, "help-api-keys-guide"],
    ["system-health", HelpSystemHealthGuideView, "help-system-health-guide"],
    ["ai-usage", HelpAiUsageGuideView, "help-ai-usage-guide"],
    ["preferences", HelpPreferencesGuideView, "help-preferences-guide"],
    ["notifications", HelpNotificationsGuideView, "help-notifications-guide"],
    ["workspace-settings", HelpWorkspaceSettingsGuideView, "help-workspace-settings-guide"],
    ["evidence-graph", HelpEvidenceGraphGuideView, "help-evidence-graph-guide"],
    ["search-review-evidence", HelpSearchReviewEvidenceGuideView, "help-search-review-evidence-guide"],
    ["architecture-intelligence", HelpArchitectureIntelligenceGuideView, "help-architecture-intelligence-guide"],
    ["sponsor-dashboard", HelpSponsorDashboardGuideView, "help-sponsor-dashboard-guide"],
    ["architecture-drafts", HelpArchitectureDraftsGuideView, "help-architecture-drafts-guide"],
    ["model-governance", HelpModelGovernanceGuideView, "help-model-governance-guide"],
    ["jira-integration", HelpJiraIntegrationGuideView, "help-jira-integration-guide"],
    ["servicenow-integration", HelpServiceNowIntegrationGuideView, "help-servicenow-integration-guide"],
  ] as const)("registers and renders %s specialty guide", (slug, View, testId) => {
    const entry = getProductDocumentationEntry(slug);

    expect(entry?.slug).toBe(slug);

    if (entry === undefined) {
      throw new Error(`Expected ${slug} documentation entry.`);
    }

    render(<View entry={entry} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();

    if (slug === "connection-status") {
      expect(screen.getByTestId("help-connection-status-primary-cta")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Help" })).toBeNull();

      return;
    }

    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
  });
});

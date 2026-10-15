import { describe, expect, it } from "vitest";

import {
  resolveIntegrationReadinessHelpClaimDiscipline,
  resolveIntegrationReadinessHelpSources,
  SECURENOW_INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  SECURENOW_INTEGRATION_READINESS_HELP_SOURCES,
} from "@/lib/integration-readiness-help-evidence-copy";
import { integrationReadinessHelpRelatedGuides } from "@/lib/integration-readiness-help-related-guides";
import { integrationReadinessHelpOverview } from "@/lib/integration-readiness-help-guide-content";
import { integrationReadinessHelpFirstViewportSectionAnchors } from "@/lib/integration-readiness-help-guide-content";

describe("integration-readiness-help SecureNow", () => {
  it("resolves SecureNow claim, sources, overview, and related guides without architecture review or Slack", () => {
    expect(resolveIntegrationReadinessHelpClaimDiscipline("security")).toBe(
      SECURENOW_INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
    );
    expect(resolveIntegrationReadinessHelpClaimDiscipline("security")).not.toMatch(/architecture review/i);

    const sources = resolveIntegrationReadinessHelpSources("security");
    expect(sources).toEqual(SECURENOW_INTEGRATION_READINESS_HELP_SOURCES);
    expect(sources.some((link) => link.label === "Architecture digests")).toBe(false);
    expect(sources.some((link) => link.label === "Azure Boards")).toBe(false);
    expect(sources.some((link) => link.href.includes("/integrations/slack"))).toBe(false);

    expect(integrationReadinessHelpOverview("security")).not.toMatch(/architecture reviews/i);
    expect(integrationReadinessHelpOverview("security")).toContain("Azure");

    const related = integrationReadinessHelpRelatedGuides("security");
    expect(related.some((guide) => guide.href.includes("servicenow-integration"))).toBe(true);
    expect(related.some((guide) => guide.href.includes("digests"))).toBe(false);

    expect(integrationReadinessHelpFirstViewportSectionAnchors("security")).not.toContain("reviews-and-integrations");
    expect(integrationReadinessHelpFirstViewportSectionAnchors("architecture")).toContain("reviews-and-integrations");
  });
});

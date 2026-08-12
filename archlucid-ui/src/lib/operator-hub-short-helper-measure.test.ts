import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPRESENTATIVE_HUB_INTRO_SOURCES = [
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubPackageIncludes.tsx",
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubRecentPackages.tsx",
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubResumeDrafts.tsx",
  "src/app/(operator)/architecture/reviews/new/ReviewsNewJobChooserSection.tsx",
  "src/app/(operator)/governance/_sections/GovernanceOverviewPanel.tsx",
  "src/app/(operator)/governance/audit/_sections/AuditPageView.tsx",
  "src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx",
  "src/app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageView.tsx",
  "src/app/(operator)/administration/_sections/SettingsPageView.tsx",
  "src/app/(operator)/administration/identity-providers/_sections/IdentityProvidersSettingsShell.tsx",
  "src/components/alerts/AlertRoutingContent.tsx",
] as const;

const PREMATURE_MEASURE_PATTERN = /max-w-(?:prose|2xl|3xl)/;

describe("operator hub short helper measure (TB-2040)", () => {
  it("keeps representative Reviews, Governance, Integrations, Settings, and Alerts hub intros full width", () => {
    const violations: string[] = [];

    for (const relativePath of REPRESENTATIVE_HUB_INTRO_SOURCES) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      if (PREMATURE_MEASURE_PATTERN.test(source)) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });
});

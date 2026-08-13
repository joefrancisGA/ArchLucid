import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { API_KEYS_PAGE_TITLE } from "@/lib/api-keys-settings-copy";
import { ALERTS_CONFIGURATION_PAGE_TITLE } from "@/lib/alerts-page-copy";
import { BASELINE_SETTINGS_PAGE_TITLE } from "@/lib/baseline-settings-present";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { OPERATOR_HOME_PAGE_TITLE } from "@/lib/operator/operator-home-page-copy";
import { STANDARDS_RULES_PAGE_TITLE } from "@/lib/standards-rules-page";
import { SYSTEM_HEALTH_PAGE_TITLE } from "@/lib/system-health-page-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const SRC_ROOT = join(process.cwd(), "src");

/** Routes where help topic label matches the visible page title — trigger must read "Help". */
const PAGE_HELP_TITLE_COLLISION_SURFACES: ReadonlyArray<{
  readonly pathname: string;
  readonly pageTitle: string;
  readonly modulePath: string;
}> = [
  {
    pathname: "/",
    pageTitle: OPERATOR_HOME_PAGE_TITLE,
    modulePath: "app/(operator)/_sections/OperatorHomePageHeader.tsx",
  },
  {
    pathname: "/governance/alert-rules",
    pageTitle: ALERTS_CONFIGURATION_PAGE_TITLE,
    modulePath: "app/(operator)/governance/alert-rules/AlertRulesPageHeader.tsx",
  },
  {
    pathname: "/governance/standards-and-rules",
    pageTitle: STANDARDS_RULES_PAGE_TITLE,
    modulePath: "app/(operator)/governance/standards-and-rules/_sections/GovernanceResolutionPageView.tsx",
  },
  {
    pathname: "/administration/api-keys",
    pageTitle: API_KEYS_PAGE_TITLE,
    modulePath: "app/(operator)/administration/api-keys/_sections/ApiKeysSettingsPageClient.tsx",
  },
  {
    pathname: "/administration/system-health",
    pageTitle: SYSTEM_HEALTH_PAGE_TITLE,
    modulePath: "app/(operator)/administration/system-health/_sections/SystemHealthPageHeader.tsx",
  },
  {
    pathname: "/insights/roi-summary",
    pageTitle: OPERATOR_NAV_LINK_LABELS.roiReport,
    modulePath: "app/(operator)/insights/roi-summary/_sections/RoiSummaryPageView.tsx",
  },
  {
    pathname: "/administration/baseline",
    pageTitle: BASELINE_SETTINGS_PAGE_TITLE,
    modulePath: "app/(operator)/administration/baseline/BaselineSettingsClient.tsx",
  },
  {
    pathname: "/administration/developer",
    pageTitle: "Internal developer tools",
    modulePath: "app/(operator)/administration/developer/DeveloperSettingsPageClient.tsx",
  },
  {
    pathname: "/architecture/first-review-guide",
    pageTitle: BUYER_ONBOARDING_PAGE_TITLE,
    modulePath: "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuidePageClient.tsx",
  },
];

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

describe("page-help-topic-map — help trigger label collisions (P0-5)", () => {
  it.each(PAGE_HELP_TITLE_COLLISION_SURFACES)(
    "$pathname maps help topic label to the page title",
    ({ pathname, pageTitle }) => {
      const topic = pageHelpTopicForPathname(pathname);

      expect(topic?.label).toBe(pageTitle);
    },
  );

  it.each(PAGE_HELP_TITLE_COLLISION_SURFACES)(
    "$pathname mounts PAGE_HELP_SHORT_TRIGGER_TEXT on PageContextualHelpButton",
    ({ modulePath }) => {
      const source = readSrcModule(modulePath);

      expect(source).toContain("PAGE_HELP_SHORT_TRIGGER_TEXT");
      expect(source).toMatch(/PageContextualHelpButton[^>]*triggerText=\{PAGE_HELP_SHORT_TRIGGER_TEXT\}/);
    },
  );
});

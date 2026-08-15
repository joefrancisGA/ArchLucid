import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ALERTS_CONFIGURATION_PAGE_TITLE } from "@/lib/alerts-page-copy";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE } from "@/lib/developer-settings-evidence-copy";
import { GOVERNANCE_SETUP_PAGE_TITLE } from "@/lib/governance/governance-setup-route";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE } from "@/lib/notification-preference-center";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import { OPERATOR_HOME_PAGE_TITLE } from "@/lib/operator/operator-home-page-copy";
import {
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_DEPLOYMENT_STATUS_PATH,
  INTERNAL_PRICING_QUOTE_AGING_PATH,
  INTERNAL_TENANT_HEALTH_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";
import { DEMO_READINESS_HELP_TOPIC_LABEL } from "@/lib/demo-readiness-evidence-copy";
import { DEPLOYMENT_STATUS_HELP_TOPIC_LABEL } from "@/lib/deployment-status-evidence-copy";
import { PRICING_QUOTE_AGING_HELP_TOPIC_LABEL } from "@/lib/pricing-quote-aging-evidence-copy";
import { TENANT_HEALTH_HELP_TOPIC_LABEL } from "@/lib/tenant-health-evidence-copy";
import { TRIAL_FUNNEL_HELP_TOPIC_LABEL } from "@/lib/trial-funnel-evidence-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { REVIEWS_HUB_PAGE_TITLE } from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-copy";

const SRC_ROOT = join(process.cwd(), "src");

/** Routes where help topic label matches the visible page title — trigger must read "Help". */
const PAGE_HELP_TITLE_COLLISION_SURFACES: ReadonlyArray<{
  readonly pathname: string;
  readonly pageTitle: string;
  readonly modulePath: string;
}> = [
  {
    pathname: "/governance/alert-rules",
    pageTitle: ALERTS_CONFIGURATION_PAGE_TITLE,
    modulePath: "app/(operator)/governance/alert-rules/AlertRulesPageHeader.tsx",
  },
  {
    pathname: "/administration/developer",
    pageTitle: INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE,
    modulePath: "app/(operator)/administration/developer/DeveloperSettingsPageClient.tsx",
  },
  {
    pathname: "/architecture/first-review-guide",
    pageTitle: BUYER_ONBOARDING_PAGE_TITLE,
    modulePath: "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuidePageClient.tsx",
  },
  {
    pathname: "/governance/setup",
    pageTitle: GOVERNANCE_SETUP_PAGE_TITLE,
    modulePath: "app/(operator)/governance/setup/_sections/GovernanceSetupGuidePageView.tsx",
  },
  {
    pathname: "/architecture/architectures",
    pageTitle: ARCHITECTURE_DRAFTS_LIST_LABEL,
    modulePath: "app/(operator)/architecture/architectures/_sections/ArchitecturesHubHeaderActions.tsx",
  },
  {
    pathname: "/administration/notifications",
    pageTitle: NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
    modulePath: "app/(operator)/administration/notifications/_sections/NotificationPreferenceCenterPageView.tsx",
  },
  {
    pathname: "/governance/alerts",
    pageTitle: OPERATOR_NAV_LINK_LABELS.alerts,
    modulePath: "app/(operator)/governance/alerts/AlertsHubChrome.tsx",
  },
  {
    pathname: "/insights/architecture-scorecard",
    pageTitle: REVIEW_SCORECARD_PAGE_TITLE,
    modulePath: "app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPageView.tsx",
  },
];

/** Routes where help topic H1 differs from the page title — trigger must read "Help", not the topic label. */
const PAGE_HELP_TOPIC_MISMATCH_SURFACES: ReadonlyArray<{
  readonly pathname: string;
  readonly pageTitle: string;
  readonly modulePath: string;
}> = [
  {
    pathname: "/architecture/reviews",
    pageTitle: REVIEWS_HUB_PAGE_TITLE,
    modulePath: "app/(operator)/architecture/reviews/_sections/ReviewsHubHeaderActions.tsx",
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

  it("operator home mounts PageContextualHelpButton with the Home topic label (not shortened Help)", () => {
    const source = readSrcModule("app/(operator)/_sections/OperatorHomePageHeader.tsx");

    expect(source).toContain("<PageContextualHelpButton");
    expect(source).not.toContain("PAGE_HELP_SHORT_TRIGGER_TEXT");
    expect(pageHelpTopicForPathname("/")?.label).toBe(OPERATOR_HOME_PAGE_TITLE);
  });
});

describe("page-help-topic-map — help trigger label mismatches (P0-5)", () => {
  it.each(PAGE_HELP_TOPIC_MISMATCH_SURFACES)(
    "$pathname maps help topic label to a different title than the page",
    ({ pathname, pageTitle }) => {
      const topic = pageHelpTopicForPathname(pathname);

      expect(topic?.label).toBeDefined();
      expect(topic?.label).not.toBe(pageTitle);
    },
  );

  it.each(PAGE_HELP_TOPIC_MISMATCH_SURFACES)(
    "$pathname mounts PAGE_HELP_SHORT_TRIGGER_TEXT on PageContextualHelpButton",
    ({ modulePath }) => {
      const source = readSrcModule(modulePath);

      expect(source).toContain("PAGE_HELP_SHORT_TRIGGER_TEXT");
      expect(source).toMatch(/PageContextualHelpButton[^>]*triggerText=\{PAGE_HELP_SHORT_TRIGGER_TEXT\}/);
    },
  );
});

const INTERNAL_OPS_CANONICAL_HELP_SURFACES: ReadonlyArray<{
  readonly pathname: string;
  readonly label: string;
}> = [
  { pathname: INTERNAL_TENANT_HEALTH_PATH, label: TENANT_HEALTH_HELP_TOPIC_LABEL },
  { pathname: INTERNAL_TRIAL_FUNNEL_PATH, label: TRIAL_FUNNEL_HELP_TOPIC_LABEL },
  { pathname: INTERNAL_DEMO_READINESS_PATH, label: DEMO_READINESS_HELP_TOPIC_LABEL },
  { pathname: INTERNAL_DEPLOYMENT_STATUS_PATH, label: DEPLOYMENT_STATUS_HELP_TOPIC_LABEL },
  { pathname: INTERNAL_PRICING_QUOTE_AGING_PATH, label: PRICING_QUOTE_AGING_HELP_TOPIC_LABEL },
];

describe("page-help-topic-map — canonical /internal/* operator ops routes", () => {
  it.each(INTERNAL_OPS_CANONICAL_HELP_SURFACES)(
    "$pathname resolves contextual help (not dead PageContextualHelpButton)",
    ({ pathname, label }) => {
      const topic = pageHelpTopicForPathname(pathname);

      expect(topic).not.toBeNull();
      expect(topic?.label).toBe(label);
    },
  );
});

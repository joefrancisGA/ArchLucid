import { ALERTS_HELP_PAGE_TITLE } from "@/lib/alerts-help-guide-content";
import { ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE } from "@/lib/architecture-drafts-help-guide-content";
import { ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE } from "@/lib/architecture-scorecard-help-guide-content";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE } from "@/lib/notification-preference-center";
import { NOTIFICATIONS_HELP_PAGE_TITLE } from "@/lib/notifications-help-guide-content";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import { TEAMS_INTEGRATION_HELP_PAGE_TITLE } from "@/lib/teams-integration-help-guide-content";
import { TEAMS_INTEGRATION_PAGE_TITLE } from "@/lib/teams-integration-page-copy";

export type HelpOperatorPageTitleParitySurface = {
  readonly slug: string;
  readonly operatorPath: string;
  readonly operatorPageTitle: string;
  readonly helpPageTitle: string;
};

/**
 * Specialty `/help/{slug}` topics whose H1 must match the linked operator surface title.
 * Contextual help buttons on those operator pages use {@link PAGE_HELP_SHORT_TRIGGER_TEXT}.
 */
export const HELP_OPERATOR_PAGE_TITLE_PARITY_SURFACES: readonly HelpOperatorPageTitleParitySurface[] = [
  {
    slug: "architecture-drafts",
    operatorPath: "/architectures",
    operatorPageTitle: ARCHITECTURE_DRAFTS_LIST_LABEL,
    helpPageTitle: ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE,
  },
  {
    slug: "notifications",
    operatorPath: "/administration/notifications",
    operatorPageTitle: NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
    helpPageTitle: NOTIFICATIONS_HELP_PAGE_TITLE,
  },
  {
    slug: "alerts",
    operatorPath: "/governance/alerts",
    operatorPageTitle: OPERATOR_NAV_LINK_LABELS.alerts,
    helpPageTitle: ALERTS_HELP_PAGE_TITLE,
  },
  {
    slug: "architecture-scorecard",
    operatorPath: "/insights/architecture-scorecard",
    operatorPageTitle: REVIEW_SCORECARD_PAGE_TITLE,
    helpPageTitle: ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE,
  },
  {
    slug: "teams-integration",
    operatorPath: "/integrations/teams",
    operatorPageTitle: TEAMS_INTEGRATION_PAGE_TITLE,
    helpPageTitle: TEAMS_INTEGRATION_HELP_PAGE_TITLE,
  },
] as const;

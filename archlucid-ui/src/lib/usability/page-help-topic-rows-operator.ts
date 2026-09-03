/**
 * Operator route prefixes and inbound labels for contextual help.
 * Domain slices live in `page-help-topic-rows-operator-*.ts`; lookup in `page-help-topic-map.ts`.
 */

import { ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL } from "@/lib/admin-diagnostics-help-evidence-copy";
import { ADMIN_HEALTH_HELP_TOPIC_LABEL } from "@/lib/admin-health-evidence-copy";
import { AI_USAGE_HELP_TOPIC_LABEL } from "@/lib/ai-usage-settings-evidence-copy";
import { AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL } from "@/lib/authentication-sign-in-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/baseline-settings-evidence-copy";
import { CAIQ_SIG_RESPONSE_HELP_TOPIC_LABEL } from "@/lib/caiq-sig-response-help-evidence-copy";
import { COMPARISON_REPLAY_HELP_TOPIC_LABEL } from "@/lib/comparison-replay-help-evidence-copy";
import { GETTING_STARTED_HELP_TOPIC_LABEL } from "@/lib/getting-started-help-guide-content";
import { GLOSSARY_HELP_TOPIC_LABEL } from "@/lib/glossary-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_TOPIC_LABEL } from "@/lib/model-governance-settings-evidence-copy";
import { NOTIFICATIONS_HELP_TOPIC_LABEL } from "@/lib/notification-preference-center";
import { OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/operator/operator-billing-settings-evidence-copy";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import { REVIEW_GUIDE_HELP_TOPIC_LABEL } from "@/lib/review-guide-help-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/troubleshooting-help-evidence-copy";
import { USERS_AND_ROLES_HELP_TOPIC_LABEL } from "@/lib/users-and-roles-help-evidence-copy";
import { WHY_ARCHLUCID_HELP_TOPIC_LABEL } from "@/lib/why-archlucid-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";

import { PAGE_HELP_TOPIC_ROWS_OPERATOR_ARCHITECTURE } from "./page-help-topic-rows-operator-architecture";
import { PAGE_HELP_TOPIC_ROWS_OPERATOR_GOVERNANCE } from "./page-help-topic-rows-operator-governance";
import { PAGE_HELP_TOPIC_ROWS_OPERATOR_INTEGRATIONS } from "./page-help-topic-rows-operator-integrations";
import { PAGE_HELP_TOPIC_ROWS_OPERATOR_PILOT } from "./page-help-topic-rows-operator-pilot";

export type PageHelpTopic = {
  /**
   * In-app `/help/{slug}` target for Learn more.
   * Omit (undefined) when Category-1 should mount without Learn more (TB-2048 / TB-2050).
   */
  readonly slug?: string;
  /** Optional hash on the resolved help href (e.g. getting-started#how-archlucid-works). */
  readonly hashFragment?: string;
  readonly label: string;
};

const PAGE_HELP_TOPIC_ROWS_OPERATOR_CORE: readonly { prefix: string; topic: PageHelpTopic }[] = [
  { prefix: "/help/getting-started", topic: { slug: "getting-started", label: GETTING_STARTED_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/admin-diagnostics",
    topic: { slug: "admin-diagnostics", label: ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/authentication-sign-in",
    topic: { slug: "authentication-sign-in", label: AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/caiq-sig-response",
    topic: { slug: "caiq-sig-response", label: CAIQ_SIG_RESPONSE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/comparison-replay",
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/troubleshooting",
    topic: { slug: "troubleshooting", label: TROUBLESHOOTING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/review-guide",
    topic: { slug: "review-guide", label: REVIEW_GUIDE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/glossary",
    topic: { slug: "glossary", label: GLOSSARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/users-and-roles",
    topic: { slug: "users-and-roles", label: USERS_AND_ROLES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/baseline-settings",
    topic: { slug: "baseline-settings", label: BASELINE_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/system-health",
    topic: { slug: "system-health", label: SYSTEM_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/ai-usage",
    topic: { slug: "ai-usage", label: AI_USAGE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/preferences",
    topic: { slug: "preferences", label: PREFERENCES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/notifications",
    topic: { slug: "notifications", label: NOTIFICATIONS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/workspace-settings",
    topic: { slug: "workspace-settings", label: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/sponsor-dashboard",
    topic: { slug: "sponsor-dashboard", label: SPONSOR_DASHBOARD_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/model-governance",
    topic: { slug: "model-governance", label: MODEL_GOVERNANCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/health",
    topic: { slug: "admin-diagnostics", label: ADMIN_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/why-archlucid",
    topic: {
      label: WHY_ARCHLUCID_HELP_TOPIC_LABEL,
    },
  },
  { prefix: "/administration/billing", topic: { slug: "billing-and-plans", label: OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL } },
];

export const PAGE_HELP_TOPIC_ROWS_OPERATOR: readonly { prefix: string; topic: PageHelpTopic }[] = [
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR_CORE,
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR_ARCHITECTURE,
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR_PILOT,
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR_GOVERNANCE,
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR_INTEGRATIONS,
];

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
import { ARCHITECTURES_NEW_HELP_TOPIC_LABEL } from "@/lib/architectures-new-evidence-copy";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { DEMO_EXPLAIN_HELP_TOPIC_LABEL } from "@/lib/demo-explain-evidence-copy";
import { EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL } from "@/lib/evidence-proposals-evidence-copy";
import { GETTING_STARTED_HELP_TOPIC_LABEL } from "@/lib/getting-started-help-guide-content";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import { IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL } from "@/lib/improvement-planning-help-evidence-copy";
import { SIGNED_RECORDS_LIST_HELP_TOPIC_LABEL } from "@/lib/signed-records-list-evidence-copy";
import { ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL } from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL } from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import { COMPARISON_REPLAY_HELP_TOPIC_LABEL } from "@/lib/comparison-replay-help-evidence-copy";
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_TOPIC_LABEL } from "@/lib/first-architecture-review-help-copy";
import { ARCHITECTURE_DRAFTS_LIST_LABEL, START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/operator/operator-billing-settings-evidence-copy";
import { PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/pilot-feedback-help-evidence-copy";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";
import { GLOSSARY_HELP_TOPIC_LABEL } from "@/lib/glossary-help-evidence-copy";
import { NOTIFICATIONS_HELP_TOPIC_LABEL } from "@/lib/notification-preference-center";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { PATTERN_LIBRARY_HELP_TOPIC_LABEL } from "@/lib/pattern-library-evidence-copy";
import { PILOT_GUIDE_HELP_TOPIC_LABEL } from "@/lib/pilot-guide-help-evidence-copy";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-scorecard-page-copy";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import { ROI_SUMMARY_HELP_TOPIC_LABEL } from "@/lib/roi-summary-help-evidence-copy";
import { ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL } from "@/lib/accelerator-chooser-help-title-honesty-surfaces";
import { SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL } from "@/lib/search-review-evidence-evidence-copy";
import { REVIEW_GUIDE_HELP_TOPIC_LABEL } from "@/lib/review-guide-help-evidence-copy";
import { REVIEW_PACKAGES_HELP_INBOUND_LABEL } from "@/lib/review-packages-help-title-honesty-surfaces";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/troubleshooting-help-evidence-copy";
import { WHY_ARCHLUCID_HELP_TOPIC_LABEL } from "@/lib/why-archlucid-evidence-copy";
import { MODEL_GOVERNANCE_HELP_TOPIC_LABEL } from "@/lib/model-governance-settings-evidence-copy";
import { USERS_AND_ROLES_HELP_TOPIC_LABEL } from "@/lib/users-and-roles-help-evidence-copy";

import { PAGE_HELP_TOPIC_ROWS_OPERATOR_GOVERNANCE } from "./page-help-topic-rows-operator-governance";
import { PAGE_HELP_TOPIC_ROWS_OPERATOR_INTEGRATIONS } from "./page-help-topic-rows-operator-integrations";

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
  {
    prefix: "/",
    topic: { slug: "first-architecture-review", label: OPERATOR_NAV_LINK_LABELS.home },
  },
  { prefix: "/architecture/first-review-guide", topic: { label: BUYER_ONBOARDING_PAGE_TITLE } },
  { prefix: "/help/getting-started", topic: { slug: "getting-started", label: GETTING_STARTED_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/accelerator-chooser",
    topic: { slug: "accelerator-chooser", label: ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL },
  },
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
    prefix: "/help/pilot-guide",
    topic: { slug: "pilot-guide", label: PILOT_GUIDE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/first-architecture-review",
    topic: { slug: "first-architecture-review", label: FIRST_ARCHITECTURE_REVIEW_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/glossary",
    topic: { slug: "glossary", label: GLOSSARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/users-and-roles",
    topic: { slug: "users-and-roles", label: USERS_AND_ROLES_HELP_TOPIC_LABEL },
  },
  { prefix: ARCHITECTURES_LIST_PATH, topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_LIST_LABEL } },
  { prefix: "/architecture/architectures/new", topic: { slug: "structured-brief", label: ARCHITECTURES_NEW_HELP_TOPIC_LABEL } },
  {
    prefix: "/architecture/architecture-intelligence",
    topic: { slug: "architecture-intelligence", label: ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL },
  },
  { prefix: "/architectures", topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_LIST_LABEL } },
  { prefix: "/architecture/reviews/new", topic: { slug: "evidence-intake", label: START_REVIEW_LABEL } },
  { prefix: "/architecture/reviews", topic: { slug: "review-packages", label: REVIEW_PACKAGES_HELP_INBOUND_LABEL } },
  {
    prefix: SIGNED_RECORDS_LIST_PATH,
    topic: { slug: "review-packages", label: SIGNED_RECORDS_LIST_HELP_TOPIC_LABEL },
  },
  { prefix: SPONSOR_DASHBOARD_HREF, topic: { slug: "sponsor-dashboard", label: SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } },
  {
    prefix: "/insights/ask-review-questions",
    topic: { slug: "prior-manifest-retrieval", label: PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL },
  },
  { prefix: "/insights/evidence-graph", topic: { slug: "evidence-graph", label: EVIDENCE_GRAPH_HELP_TOPIC_LABEL } },
  {
    prefix: "/insights/search-review-evidence",
    topic: { slug: "search-review-evidence", label: SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/compare-two-reviews",
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/patterns",
    topic: { slug: "repeat-review-loop", label: PATTERN_LIBRARY_HELP_TOPIC_LABEL },
  },
  { prefix: "/replay", topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL } },
  {
    prefix: "/internal/replay",
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_REPLAY_PATH,
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/architecture-scorecard",
    topic: {
      slug: "architecture-scorecard",
      label: REVIEW_SCORECARD_PAGE_TITLE,
    },
  },
  {
    prefix: "/insights/sponsor-report",
    topic: { slug: "sponsor-report", label: SPONSOR_REPORT_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/sponsor-report/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  { prefix: "/sponsor-report", topic: { slug: "sponsor-report", label: SPONSOR_REPORT_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/architecture-scorecard",
    topic: { slug: "architecture-scorecard", label: ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL },
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
    prefix: "/help/evidence-graph",
    topic: { slug: "evidence-graph", label: EVIDENCE_GRAPH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/sponsor-dashboard",
    topic: { slug: "sponsor-dashboard", label: SPONSOR_DASHBOARD_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/architecture-drafts",
    topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/model-governance",
    topic: { slug: "model-governance", label: MODEL_GOVERNANCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/improvement-planning",
    topic: { slug: "improvement-planning", label: IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/evidence-proposals",
    topic: { slug: "evidence-trail", label: EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/evidence-proposals",
    topic: { slug: "evidence-trail", label: EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/product-learning",
    topic: { slug: "pilot-feedback", label: PILOT_FEEDBACK_HELP_TOPIC_LABEL },
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
  {
    prefix: "/demo/explain",
    topic: { slug: "evidence-trail", label: DEMO_EXPLAIN_HELP_TOPIC_LABEL },
  },
  { prefix: "/administration/billing", topic: { slug: "billing-and-plans", label: OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL } },
];

export const PAGE_HELP_TOPIC_ROWS_OPERATOR: readonly { prefix: string; topic: PageHelpTopic }[] = [
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR_CORE,
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR_GOVERNANCE,
  ...PAGE_HELP_TOPIC_ROWS_OPERATOR_INTEGRATIONS,
];

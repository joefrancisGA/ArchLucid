import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  BUYER_START_ARCHITECTURE_REVIEW_CTA,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE,
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
} from "@/lib/empty-state-presets";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_FINDINGS_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import {
  ALERT_RULES_LIST_EMPTY_BODY,
} from "@/lib/alert-rule-conditions-copy";
import {
  COMPOSITE_RULES_LIST_EMPTY_BODY,
  COMPOSITE_RULES_NOUN,
} from "@/lib/enterprise-controls-context-copy";
import {
  ADVISORY_SCANS_SCHEDULES_EMPTY_BODY,
} from "@/lib/advisory-copy";
import {
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF,
  ALERTS_CONFIGURE_RULES_LINK_LABEL,
  ALERTS_EMPTY_FILTERED_BODY,
  ALERTS_EMPTY_FILTERED_TITLE,
  ALERTS_EMPTY_HEALTHY_BODY,
  ALERTS_EMPTY_HEALTHY_TITLE,
  ALERTS_EMPTY_NO_REVIEWS_BODY,
  ALERTS_EMPTY_NO_REVIEWS_TITLE,
  ALERTS_EMPTY_NO_RULES_BODY,
  ALERTS_EMPTY_NO_RULES_TITLE,
} from "@/lib/alerts-page-copy";
import {
  STANDARDS_RULES_EMPTY_BODY,
  STANDARDS_RULES_EMPTY_HEADING,
} from "@/lib/standards-rules-page";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  buildOperatorFilteredEmptyCompact,
  buildOperatorHubZoneEmptyCompact,
  buildOperatorPermissionEmptyCompact,
  buildOperatorPrerequisiteEmptyCompact,
} from "@/lib/operator/operator-empty-state-kind-presets";
import {
  ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
  ACCOUNT_SECURITY_DEMO_GATE_MESSAGE,
} from "@/lib/account-security-page-copy";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import {
  API_KEYS_FORBIDDEN_EMPTY_BODY,
  API_KEYS_SURFACE_DISABLED_DESCRIPTION,
} from "@/lib/api-keys-settings-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_HEADING,
  REVIEW_SCORECARD_EMPTY_PRIMARY_CTA,
  REVIEW_SCORECARD_EMPTY_PRIMARY_HREF,
  REVIEW_SCORECARD_EMPTY_SECONDARY_CTA,
  REVIEW_SCORECARD_EMPTY_SECONDARY_HREF,
  REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
  buildReviewScorecardSampleHref,
} from "@/lib/review-scorecard-empty-state";
import { PILOT_FEEDBACK_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  INTEGRATION_EVENTS_DLQ_EMPTY_DESCRIPTION,
  INTEGRATION_EVENTS_DLQ_EMPTY_TITLE,
} from "@/lib/integration-events-dlq-page-copy";
import { WEBHOOKS_EMPTY_BODY, WEBHOOKS_EMPTY_TITLE } from "@/lib/webhooks-page-copy";
import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { API_KEYS_USERS_USERS_LINK } from "@/lib/vocabulary/api-keys-users-vocabulary";

/** Reviews list when the project has zero reviews. */
export const RUNS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "runs-list-empty-state",
  title: "No reviews yet",
  description:
    "Start an architecture review to gather evidence, evaluate findings, and record decisions. Or explore the sample review.",
  actions: [
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/architecture/reviews/new", variant: "primary" },
    { label: AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL, href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`, variant: "outline" },
  ],
};

/** Operator home reviews zone — copy only; primary next step lives on the hero Do-this-next card (TB-1038). */
export const OPERATOR_HOME_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "operator-home-workspace-empty-state",
  title: OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
  description: OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
};

/** Workspace Activity archived filter — no archived reviews in scope. */
export const OPERATOR_HOME_ARCHIVED_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "operator-home-workspace-archived-empty-state",
  title: OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE,
  description: OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY,
};

/** Semantic search returned no hits. */
export const SEARCH_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "search-empty-state",
  title: "No matches for that query",
  description:
    "Try different wording, clear the review filter, or ensure your workspace has finalized review evidence indexed for search.",
  actions: [
    { label: "Open Ask", href: "/insights/ask-review-questions", variant: "outline" },
    { label: "Evidence graph", href: "/insights/evidence-graph", variant: "outline" },
    { label: "View reviews", href: "/architecture/reviews", variant: "outline" },
  ],
};

/** Planning themes/plans empty for current scope. */
export const PLANNING_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "planning-empty-state",
  title: "No improvement plans yet",
  description:
    "Capture review feedback or run pilot feedback analysis to generate themes and prioritized plans.",
  actions: [
    { label: "Capture review feedback", href: "/internal/product-learning", variant: "primary" },
    { label: "View reviews", href: "/architecture/reviews", variant: "outline" },
  ],
};

/** Compare page before both reviews are selected. */
export const COMPARE_WAITING_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-waiting-empty-state",
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
  ],
};

/** Compare finding correlation panel when export metadata is absent. */
export const COMPARE_FINDING_CORRELATION_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-finding-correlation-empty-state",
  title: "No correlation metadata",
  description:
    "No finding correlation metadata on this comparison (API may predate correlation export metadata).",
};

/** Governance approval lineage — findings card when the snapshot has no linked findings. */
export const GOVERNANCE_APPROVAL_LINEAGE_FINDINGS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-approval-lineage-findings-empty-state",
  title: "No findings in lineage",
  description:
    "Findings appear when this approval links to a review that has a findings snapshot.",
};

/** Governance approval lineage — rare null-data fallback after a non-error load path. */
export const GOVERNANCE_APPROVAL_LINEAGE_NO_DATA_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-approval-lineage-no-data",
  title: "Could not load lineage",
  description: "Lineage could not be loaded.",
};

/** Compare page when zero finalized reviews exist. */
export const COMPARE_ZERO_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-zero-finalized-empty-state",
  title: "No finalized reviews available",
  description:
    "You need at least two finalized reviews before ArchLucid can compare changes over time.",
  actions: [
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/architecture/reviews/new", variant: "primary" },
    { label: "Open reviews", href: "/architecture/reviews", variant: "outline" },
  ],
};

/** Architecture scorecard when no finalized reviews exist yet. */
export const REVIEW_SCORECARD_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "review-scorecard-empty-state",
  title: REVIEW_SCORECARD_EMPTY_HEADING,
  description: REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  actions: [
    { label: REVIEW_SCORECARD_EMPTY_PRIMARY_CTA, href: REVIEW_SCORECARD_EMPTY_PRIMARY_HREF, variant: "primary" },
    { label: REVIEW_SCORECARD_EMPTY_TERTIARY_CTA, href: buildReviewScorecardSampleHref(), variant: "outline" },
    { label: REVIEW_SCORECARD_EMPTY_SECONDARY_CTA, href: REVIEW_SCORECARD_EMPTY_SECONDARY_HREF, variant: "outline" },
  ],
};

/** Pilot feedback dashboard when no signals exist in the selected scope. */
export const PRODUCT_LEARNING_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "product-learning-empty-state",
  title: PILOT_FEEDBACK_VOCABULARY.emptyStateTitle,
  description: PILOT_FEEDBACK_VOCABULARY.emptyStateDescription,
  actions: [
    { label: PILOT_FEEDBACK_VOCABULARY.emptyStatePrimaryAction, href: "/architecture/reviews", variant: "primary" },
    {
      label: PILOT_FEEDBACK_VOCABULARY.emptyStateSecondaryAction,
      href: "/architecture/reviews/new",
      variant: "outline",
    },
  ],
};

/** Webhook subscriptions list when the tenant has no subscriptions yet. */
export const WEBHOOKS_SUBSCRIPTIONS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "webhooks-empty-state",
  title: WEBHOOKS_EMPTY_TITLE,
  description: WEBHOOKS_EMPTY_BODY,
};

/** Internal ops DLQ when no failed integration messages exist. */
export const INTEGRATION_EVENTS_DLQ_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "integration-events-dlq-empty-state",
  title: INTEGRATION_EVENTS_DLQ_EMPTY_TITLE,
  description: INTEGRATION_EVENTS_DLQ_EMPTY_DESCRIPTION,
};

/** Internal ops DLQ when filters hide every row. */
export const INTEGRATION_EVENTS_DLQ_FILTER_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "integration-events-dlq-filter-empty-state",
  title: "No rows match these filters",
  description: "Clear filters or broaden the tenant substring to review failed messages again.",
};

/** Compare page when fewer than two finalized reviews exist. */
export const COMPARE_INSUFFICIENT_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-insufficient-finalized-empty-state",
  title: "One finalized review available",
  description: "Finalize one more review to compare changes over time.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/architecture/reviews/new", variant: "outline" },
  ],
};

/** SCIM token list when no inbound provisioning tokens exist yet. */
export const SCIM_NO_TOKENS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "scim-no-tokens-empty-state",
  title: "No active SCIM tokens",
  description: "Create a token above to begin configuring automated user and group provisioning.",
};

/** Identity provider catalog when hosting configuration has not produced rows yet. */
export const IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "identity-providers-catalog-empty-state",
  title: "No identity provider catalog rows yet",
  description:
    "OIDC and SAML settings are configured in your hosting environment. Use the SSO wizard for guided tenant setup; this read-only table populates when values are present.",
  actions: [
    { label: "Open SSO wizard", href: "/administration/identity/sso-wizard", variant: "primary" },
    { label: "SCIM provisioning", href: "/administration/scim-provisioning", variant: "outline" },
  ],
};

/** Decision register when no signed decisions exist for the workspace. */
export const DECISION_REGISTER_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "decision-register-empty-state",
  title: "No architecture decisions yet",
  description:
    "Finalize a review to lock its sealed review record. Architecture decisions from that package then appear here with findings and evidence lineage.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
    { label: "Start architecture review", href: "/architecture/reviews/new", variant: "outline" },
    { label: "Open governance workflow", href: GOVERNANCE_APPROVAL_QUEUE_PATH, variant: "outline" },
  ],
};

/** Sponsor reviews index when no finalized packages exist. */
export const SPONSOR_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "sponsor-reviews-empty-state",
  title: "No finalized reviews yet",
  description:
    "Finalized reviews appear here after you finalize the review and lock the architecture review.",
  actions: [
    { label: "See a completed sample review", href: "/see-it", variant: "primary" },
    { label: "Start a review", href: "/architecture/reviews/new", variant: "outline" },
  ],
};

/** Standards & rules register when no rules apply to the current review scope. */
export const STANDARDS_RULES_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "standards-rules-empty-state",
  title: STANDARDS_RULES_EMPTY_HEADING,
  description: STANDARDS_RULES_EMPTY_BODY,
  actions: [
    { label: "Open policy packs", href: "/governance/policy-packs", variant: "primary" },
    {
      label: "View review evidence",
      href: `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
      variant: "outline",
    },
  ],
};

/** Governance findings queue when rows exist but the active filter hides all of them. */
export const GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT: EnterpriseCompactEmptyStateProps =
  buildOperatorFilteredEmptyCompact({
    testId: "governance-findings-filter-no-match-empty-state",
    nounPhrase: "risks",
    description: "Try All or choose a different operational filter to see findings in the register.",
    actions: [],
  });

/** Governance findings queue when the register fetch failed — distinct from a genuinely empty register. */
export const GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-findings-load-failed",
  title: "Could not load architecture risk register",
  description:
    "The risk register did not load for this workspace. Your existing findings are unchanged — retry the load or check connectivity before navigating away.",
  actions: [],
};

/** Assigned-to-me findings queue when the personal fetch failed. */
export const GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-findings-load-failed",
  title: "Could not load your assigned findings",
  description:
    "Your assigned findings did not load for this workspace. Retry the load or check connectivity before navigating away.",
  actions: [],
};

/** Assigned-to-me findings queue when no rows are assigned to the signed-in operator. */
export const GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-findings-empty-state",
  title: "No findings assigned to you",
  description:
    "When findings are assigned to you for remediation, they appear here across reviews in this workspace.",
  actions: [{ label: "Open reviews", href: "/architecture/reviews", variant: "outline" }],
};

/** Assigned-to-me findings queue when filters hide every row. */
export const GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_FILTER_NO_MATCH_COMPACT: EnterpriseCompactEmptyStateProps =
  buildOperatorFilteredEmptyCompact({
    testId: "governance-findings-filter-no-match-empty-state",
    nounPhrase: "assigned findings",
    description: "Try All or choose a different filter to see findings assigned to you.",
    actions: [],
  });

/** Governance workflow approvals list when the active review has no requests yet. */
export const GOVERNANCE_WORKFLOW_NO_APPROVALS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-workflow-no-approvals",
  title: "No approval requests for this review",
  description: "",
};

/** Governance workflow promotions timeline when no releases exist for the selected review. */
export const GOVERNANCE_WORKFLOW_NO_PROMOTIONS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-workflow-no-promotions",
  title: "No governance releases recorded yet",
  description: "",
};

/** Governance workflow activations list when no environment activations exist yet. */
export const GOVERNANCE_WORKFLOW_NO_ACTIVATIONS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-workflow-no-activations",
  title: "No activations recorded yet",
  description: "",
};

/** Settings roles matrix load failure. */
export const SETTINGS_ROLES_MATRIX_LOAD_FAILED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "settings-roles-matrix-load-failed",
  title: "Role matrix unavailable",
  description: "Custom roles and permissions could not be loaded. Refresh to try again.",
};

/** Pending invitations panel load failure. */
export const SETTINGS_ROLES_PENDING_INVITATIONS_LOAD_FAILED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "settings-roles-pending-invitations-unavailable",
  title: "Pending invitations unavailable",
  description:
    "ArchLucid could not load pending invitations for this workspace. Try again or check system health.",
};

/** Run detail deliverables panel before the review is finalized. */
export const RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "run-deliverables-pending-finalize-empty-state",
  title: "No deliverables yet",
  description:
    "Signed deliverables appear here after you finalize the review on review detail. Until then, findings and evidence remain on the review.",
  actions: [],
};

/** Run detail deliverables when a negative feasibility decision is the complete deliverable. */
export const RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "run-detail-decision-receipt-empty-state",
  title: "Decision delivered — design not feasible",
  description:
    'A defensible "no" is a complete deliverable. Export the decision receipt for audit, sponsor handoff, or portfolio records.',
};

/** Signed-record manifest when the artifact descriptor list is empty (operator chrome). */
export const MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "manifest-deliverables-empty-state",
  title: "No artifacts listed for this review",
  description:
    "The summary loaded, but the artifact descriptor list is empty. Bundle download may be available when there is a bundle.",
};

/** Buyer-polished compare idle state. */
export const COMPARE_WAITING_BUYER_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-waiting-empty-state",
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
  ],
};

/** Alert rules Conditions tab when no rules exist yet (TB-1555 hub-zone preset). */
export const ALERT_RULES_LIST_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = buildOperatorHubZoneEmptyCompact(
  "alert rules",
  {
    testId: "alert-rules-empty",
    description: ALERT_RULES_LIST_EMPTY_BODY,
  },
);

/** Composite alert rules tab when no composite rules exist yet (TB-1555 hub-zone preset). */
export const COMPOSITE_RULES_LIST_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = buildOperatorHubZoneEmptyCompact(
  COMPOSITE_RULES_NOUN,
  {
    testId: "composite-alert-rules-empty",
    description: COMPOSITE_RULES_LIST_EMPTY_BODY,
  },
);

/** Advisory Schedules tab when no schedules exist yet (TB-1555 hub-zone preset). */
export const ADVISORY_SCHEDULES_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = buildOperatorHubZoneEmptyCompact(
  "advisory-scan schedules",
  {
    testId: "advisory-schedules-empty",
    description: ADVISORY_SCANS_SCHEDULES_EMPTY_BODY,
  },
);

/** Alerts inbox — status filter yields zero rows while alerts exist (TB-1555 filtered preset). */
export const ALERTS_INBOX_FILTERED_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "alerts-inbox-empty-state",
  title: ALERTS_EMPTY_FILTERED_TITLE,
  description: ALERTS_EMPTY_FILTERED_BODY,
  actions: [
    { label: ALERTS_ACTION_OPEN_REVIEW_PACKAGES, href: ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF, variant: "primary" },
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
      variant: "outline",
    },
  ],
};

/** Alerts inbox — workspace has reviews but no alert rules (TB-1555 prerequisite preset). */
export const ALERTS_INBOX_NO_RULES_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "alerts-inbox-empty-state",
  title: ALERTS_EMPTY_NO_RULES_TITLE,
  description: ALERTS_EMPTY_NO_RULES_BODY,
  actions: [
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
      variant: "primary",
    },
    {
      label: ALERTS_CONFIGURE_RULES_LINK_LABEL,
      href: governanceAlertRulesTabHref("rules"),
      variant: "outline",
    },
  ],
};

/** Alerts inbox — workspace has rules but no reviews yet (TB-1555 prerequisite preset). */
export const ALERTS_INBOX_NO_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "alerts-inbox-empty-state",
  title: ALERTS_EMPTY_NO_REVIEWS_TITLE,
  description: ALERTS_EMPTY_NO_REVIEWS_BODY,
  actions: [
    {
      label: ALERTS_ACTION_START_ARCHITECTURE_REVIEW,
      href: ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF,
      variant: "primary",
    },
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
      variant: "outline",
    },
  ],
};

/** Alerts inbox — healthy workspace with no open alerts (TB-1555 collection preset). */
export const ALERTS_INBOX_HEALTHY_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "alerts-inbox-empty-state",
  title: ALERTS_EMPTY_HEALTHY_TITLE,
  description: ALERTS_EMPTY_HEALTHY_BODY,
  actions: [
    { label: ALERTS_ACTION_OPEN_REVIEW_PACKAGES, href: ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF, variant: "primary" },
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
      variant: "outline",
    },
  ],
};

/** Account security — frictionless demo workspace blocks personal sign-in management (prerequisite). */
export const ACCOUNT_SECURITY_DEMO_BLOCKED_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps =
  buildOperatorPrerequisiteEmptyCompact("Full workspace account", {
    testId: "account-security-demo-blocked-empty-state",
    description: ACCOUNT_SECURITY_DEMO_GATE_MESSAGE,
  });

/** Account security — signed-in platform account required before listing sign-in methods (prerequisite). */
export const ACCOUNT_SECURITY_AUTH_REQUIRED_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps =
  buildOperatorPrerequisiteEmptyCompact("Signed-in ArchLucid account", {
    testId: "account-security-auth-required-empty-state",
    description: ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
    actions: [
      {
        label: "Sign in",
        href: buildAuthSignInHref({ returnPath: ACCOUNT_SECURITY_PATH }),
        variant: "primary",
      },
    ],
  });

/** API keys settings — in-product surface parked; people and host credentials live elsewhere. */
export const API_KEYS_SURFACE_DISABLED_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "api-keys-surface-disabled-empty-state",
  title: "Manage access elsewhere",
  description: API_KEYS_SURFACE_DISABLED_DESCRIPTION,
  actions: [
    {
      label: API_KEYS_USERS_USERS_LINK.label,
      href: API_KEYS_USERS_USERS_LINK.href,
      variant: "primary",
    },
    {
      label: OPERATOR_NAV_LINK_LABELS.settings,
      href: SETTINGS_ROOT_PATH,
      variant: "outline",
    },
  ],
};

/** API keys settings — workspace administrator authority required (permission). */
export const API_KEYS_FORBIDDEN_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps =
  buildOperatorPermissionEmptyCompact("manage API keys", {
    testId: "api-keys-forbidden-empty-state",
    description: API_KEYS_FORBIDDEN_EMPTY_BODY,
    actions: [
      {
        label: API_KEYS_USERS_USERS_LINK.label,
        href: API_KEYS_USERS_USERS_LINK.href,
        variant: "primary",
      },
      {
        label: OPERATOR_NAV_LINK_LABELS.settings,
        href: SETTINGS_ROOT_PATH,
        variant: "outline",
      },
    ],
  });

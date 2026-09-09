/**
 * Plain-language route orientation copy ("explain this page in ~30 seconds").
 * Routes with OperatorPageHeader / layer strips / dense governance headers return `null`
 * unless explicitly opted into the table below (TB-2216 / TB-2257).
 */

export type RouteViewExplanationLink = {
  readonly label: string;
  readonly href: string;
};

export type RouteViewExplanation = {
  readonly title: string;
  readonly summary: string;
  readonly nextAction: string;
  readonly nextActionLinks?: readonly RouteViewExplanationLink[];
};

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ARCHITECTURES_LIST_PATH, REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { AUTH_DOMAINS_SETTINGS_CANONICAL_PATH } from "@/lib/auth-domains-settings-evidence-copy";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import { CLOUD_CONNECTIONS_CANONICAL_PATH } from "@/lib/cloud-connections-evidence-copy";
import { CLOUD_PROVIDER_CONNECTION_PATHS } from "@/lib/cloud-provider-connection-evidence-copy";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { DIGESTS_HUB_PATH, digestsHubTabFromLocation } from "@/lib/digests-route-paths";
import { EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH } from "@/lib/extract-upload-settings-evidence-copy";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  INTEGRATIONS_AZURE_BOARDS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import type { ImpactPreviewPageState } from "@/lib/impact-preview-page-types";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { NOTIFICATION_PREFERENCE_CENTER_PATH } from "@/lib/notification-preference-center";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import {
  SETTINGS_ROOT_PATH,
  SETTINGS_SECURITY_TRUST_PATH,
  SETTINGS_SUPPORT_PATH,
  SETTINGS_USERS_PATH,
  SETTINGS_WORKSPACE_SETTINGS_PATH,
} from "@/lib/settings-admin-route-paths";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";

const IDENTITY_PROVIDERS_TAB_DISMISS_KEY =
  "archlucid.explain-view.dismissed./administration/identity-providers-tabs" as const;

function explainViewDismissKey(pathname: string): string {
  if (
    pathname === "/administration/identity-providers/saml"
    || pathname === "/administration/identity-providers/oidc"
    || pathname === "/administration/identity-providers/role-mapping"
  ) {
    return IDENTITY_PROVIDERS_TAB_DISMISS_KEY;
  }

  return `archlucid.explain-view.dismissed.${pathname}`;
}

export { IDENTITY_PROVIDERS_TAB_DISMISS_KEY, explainViewDismissKey };

type RouteViewExplanationRow = {
  readonly prefix: string;
  /**
   * When true only the exact path matches. Use for inventory or hub rows whose copy would be wrong
   * on the detail routes beneath them (telling an open draft to "open a draft", for example).
   */
  readonly matchExact?: boolean;
  readonly explanation: RouteViewExplanation;
};

/** True when this row owns orientation for the supplied path. */
function routeMatchesExplanationRow(path: string, row: RouteViewExplanationRow): boolean {
  if (row.matchExact === true) {
    return path === row.prefix;
  }

  return path === row.prefix || path.startsWith(`${row.prefix}/`);
}

const ROUTE_VIEW_EXPLANATIONS: readonly RouteViewExplanationRow[] = [
  {
    prefix: ASK_REVIEW_QUESTIONS_PATH,
    explanation: {
      title: "Ask review questions",
      summary:
        "Ask natural-language questions about evidence, findings, and architecture decisions in a committed review package.",
      nextAction: "Select a review (or open one from review detail), then ask a focused question about findings or evidence.",
    },
  },
  {
    prefix: REVIEWS_LIST_PATH,
    matchExact: true,
    explanation: {
      title: "Reviews",
      summary:
        "Browse architecture review packages in this workspace — open one to triage findings, evidence, and approval status.",
      nextAction: "Open the review you need, or start a new review when you are ready to assess a draft architecture.",
    },
  },
  {
    prefix: REVIEWS_NEW_PATH,
    matchExact: true,
    explanation: {
      title: "Start a review",
      summary: "Choose an intake path and submit evidence for architecture analysis in this workspace.",
      nextAction:
        "Pick quick, guided, or detailed intake, complete the required fields, then submit to create the review.",
    },
  },
  {
    prefix: SEARCH_REVIEW_EVIDENCE_PATH,
    explanation: {
      title: "Search review evidence",
      summary:
        "Find citations across findings, decisions, and finalized review records in this workspace — a retrieval launcher, not a full audit export.",
      nextAction:
        "Enter a phrase, optionally limit to one review, then open the hit or Evidence trail before briefing sponsors.",
    },
  },
  {
    prefix: PATTERN_LIBRARY_PATH,
    matchExact: true,
    explanation: {
      title: "Pattern library",
      summary:
        "Browse anonymized architecture patterns with adoption, risk, and approval signals — aggregated guidance, not your workspace inventory.",
      nextAction: "Filter the catalog, open a pattern, then start a review when a pattern fits your next change.",
    },
  },
  {
    prefix: HELP_HUB_CANONICAL_PATH,
    matchExact: true,
    explanation: {
      title: "Help",
      summary:
        "Browse how-to guides, troubleshooting, and procurement orientation for architecture reviews in this workspace.",
      nextAction:
        "Search or pick a guide below — open First architecture review for onboarding, or Security & trust for diligence.",
    },
  },
  {
    prefix: SPONSOR_DASHBOARD_HREF,
    matchExact: true,
    explanation: {
      title: "Portfolio overview",
      summary:
        "Track ROI, risk posture, and approval status across finalized reviews — sponsor-facing portfolio metrics for this workspace.",
      nextAction:
        "Confirm baseline and ROI settings, then scan KPI cards and exports for your reporting period.",
    },
  },
  {
    prefix: SETTINGS_SECURITY_TRUST_PATH,
    explanation: {
      title: "Security & trust",
      summary:
        "Procurement-ready security materials, trust-center links, and self-assessment status for this workspace.",
      nextAction:
        "Open the public trust center link or SOC 2 self-assessment row, then download only what your diligence packet requires.",
    },
  },
  {
    prefix: SETTINGS_WORKSPACE_SETTINGS_PATH,
    matchExact: true,
    explanation: {
      title: "Workspace settings",
      summary:
        "Configure trial status, review cost basis, request scope, and quality gates that shape how this tenant runs reviews.",
      nextAction: "Confirm active workspace scope, then set ROI/cost inputs and routing scope before inviting reviewers.",
    },
  },
  {
    prefix: SETTINGS_USERS_PATH,
    matchExact: true,
    explanation: {
      title: "Users & roles",
      summary:
        "Manage workspace members, role assignments, and API keys that control who can read, execute, or administer reviews.",
      nextAction: "Invite reviewers on the Users tab, confirm role mappings on Roles, then issue API keys only for automation.",
    },
  },
  {
    prefix: SETTINGS_SUPPORT_PATH,
    matchExact: true,
    explanation: {
      title: "Support",
      summary:
        "Contact ArchLucid support, gather redacted diagnostics, and follow guided troubleshooting paths for this workspace.",
      nextAction:
        "Start with System health, download a support bundle when requested, then open the matching troubleshooting guide.",
    },
  },
  {
    prefix: AUTH_DOMAINS_SETTINGS_CANONICAL_PATH,
    matchExact: true,
    explanation: {
      title: "Sign-in domains",
      summary:
        "Verify email domain ownership, test SSO routing, and enable domain enforcement for this workspace.",
      nextAction:
        "Add and verify a domain, test routing, then open Identity providers before enabling SSO enforcement.",
    },
  },
  {
    prefix: EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
    matchExact: true,
    explanation: {
      title: "Extract and upload",
      summary:
        "Run the read-only Azure extractor locally, validate the ZIP, then upload inventory for architecture reviews.",
      nextAction:
        "Copy the quick-start command, upload a validated ZIP, then open Start a review when the package is ready.",
    },
  },
  {
    prefix: SETTINGS_ROOT_PATH,
    matchExact: true,
    explanation: {
      title: "Administration",
      summary:
        "Search and open workspace, integration, security, billing, and support configuration pages for this tenant.",
      nextAction: "Search or browse a section, then open the destination page to change settings.",
    },
  },
  {
    prefix: NOTIFICATION_PREFERENCE_CENTER_PATH,
    matchExact: true,
    explanation: {
      title: "Notifications",
      summary:
        "Channel launcher for digests, in-product alerts, alert rules, Teams, and Slack — each destination saves its own settings.",
      nextAction: "Scan each channel card, then open the destination page to change subscriptions, rules, or webhook connections.",
    },
  },
  {
    prefix: CONNECTION_STATUS_CANONICAL_PATH,
    matchExact: true,
    explanation: {
      title: "Connection status",
      summary:
        "See which workspace integrations are configured, recommended, or need attention before reviews depend on them.",
      nextAction:
        "Scan connector tiles, open the matching integration page when setup is incomplete, then open System health for runtime checks.",
    },
  },
  {
    prefix: CLOUD_CONNECTIONS_CANONICAL_PATH,
    matchExact: true,
    explanation: {
      title: "Cloud connections",
      summary:
        "Connect Azure, AWS, or Google Cloud for optional read-only evidence collection, or start evidence-only reviews without a connector.",
      nextAction:
        "Choose platforms to show, open a provider to configure federation, or start an evidence-only review from uploaded packages.",
    },
  },
  {
    prefix: CLOUD_PROVIDER_CONNECTION_PATHS.azure,
    matchExact: true,
    explanation: {
      title: "Azure cloud connection",
      summary:
        "Configure read-only federated service-principal access for subscription inventory collection.",
      nextAction:
        "Complete security preflight, run the Tier 2 wizard, save and validate, then return to Cloud connections for workspace status.",
    },
  },
  {
    prefix: CLOUD_PROVIDER_CONNECTION_PATHS.aws,
    matchExact: true,
    explanation: {
      title: "AWS cloud connection",
      summary: "Configure a read-only federated IAM role for Resource Explorer inventory collection.",
      nextAction:
        "Complete security preflight, enter the role ARN, save the connection, then re-poll to validate access.",
    },
  },
  {
    prefix: CLOUD_PROVIDER_CONNECTION_PATHS.gcp,
    matchExact: true,
    explanation: {
      title: "GCP cloud connection",
      summary: "Configure read-only Cloud Asset Inventory through Workload Identity Federation.",
      nextAction:
        "Complete security preflight, record the pool provider and service-account email, save the connection, then re-poll to validate access.",
    },
  },
  {
    prefix: INTEGRATIONS_JIRA_PATH,
    matchExact: true,
    explanation: {
      title: "Jira integration",
      summary:
        "Outbound work-item settings, connection health, and tenant overrides for creating Jira issues from ArchLucid.",
      nextAction:
        "Test the connector, set project and severity mappings, then open Connection status when the path is not ready.",
    },
  },
  {
    prefix: INTEGRATIONS_SERVICENOW_PATH,
    matchExact: true,
    explanation: {
      title: "ServiceNow integration",
      summary:
        "Outbound incident settings, connection health, and CMDB overrides for creating ServiceNow records from ArchLucid.",
      nextAction:
        "Test the connector, adjust CMDB auto-create if needed, then open Connection status when the path is not ready.",
    },
  },
  {
    prefix: INTEGRATIONS_AZURE_BOARDS_PATH,
    matchExact: true,
    explanation: {
      title: "Azure Boards integration",
      summary:
        "Outbound work-item settings, connection health, and defaults for creating Azure Boards work items from ArchLucid.",
      nextAction:
        "Test the connector, set organization project and work-item defaults, then open Connection status when the path is not ready.",
    },
  },
  {
    prefix: INTEGRATIONS_SLACK_PATH,
    matchExact: true,
    explanation: {
      title: "Slack integration",
      summary: "Configure incoming webhook destinations that receive alerts for this workspace.",
      nextAction:
        "Add or test a Slack destination, then open Alert rules when you need to change which events fire notifications.",
    },
  },
  {
    prefix: INTEGRATIONS_TEAMS_PATH,
    matchExact: true,
    explanation: {
      title: "Microsoft Teams integration",
      summary: "Configure a Teams channel destination that receives alerts for this workspace.",
      nextAction:
        "Save or test the Teams connector, then open Alert rules when you need to change which events fire notifications.",
    },
  },
  {
    prefix: INTEGRATIONS_WEBHOOKS_PATH,
    matchExact: true,
    explanation: {
      title: "Webhooks",
      summary: "Configure HTTPS webhook subscriptions that receive alerts for this workspace.",
      nextAction:
        "Add or test a subscription, then open Alert rules when you need to change which events fire notifications.",
    },
  },
  {
    prefix: BASELINE_SETTINGS_CANONICAL_PATH,
    matchExact: true,
    explanation: {
      title: "Baseline settings",
      summary:
        "Capture ROI measurement anchors (review cycle hours, prep time, people per review) for this workspace.",
      nextAction:
        "Save or clear baseline anchors, then open Architecture scorecard or ROI summary when numbers need methodology.",
    },
  },
  {
    prefix: ADMINISTRATION_SYSTEM_HEALTH_PATH,
    matchExact: true,
    explanation: {
      title: "System health",
      summary: "Workspace service health, required dependencies, and deployment identity for this tenant.",
      nextAction: "Refresh readiness, then open Connection status when a dependency needs follow-up.",
    },
  },
  {
    prefix: FIRST_REVIEW_GUIDE_PATH,
    matchExact: true,
    explanation: {
      title: "First review guide",
      summary:
        "Checklist onboarding for your first architecture draft or review, including required setup and optional workspace steps.",
      nextAction:
        "Clear required setup blockers, then create architecture or start a review when the workspace is ready.",
    },
  },
  {
    prefix: ARCHITECTURE_INTELLIGENCE_PATH,
    explanation: {
      title: "Architecture intelligence",
      summary:
        "Run closed-loop architecture reasoning against a free-form description, then publish findings into the workspace review trail when ready.",
      nextAction:
        "Paste or edit a description, run architecture reasoning, then publish findings into review when the output is ready to attach.",
    },
  },
  {
    prefix: ARCHITECTURE_SCORECARD_PATH,
    matchExact: true,
    explanation: {
      title: "Architecture scorecard",
      summary:
        "Workspace throughput tiles and a directional review-time savings model for pilot discussions.",
      nextAction: "Finalize reviews to populate tiles, then tune ROI assumptions or open ROI summary for sponsor exports.",
    },
  },
  {
    prefix: SPONSOR_REPORT_PATH,
    matchExact: true,
    explanation: {
      title: "Sponsor report",
      summary:
        "Period summary of finalized reviews, material findings, approval decisions, and directional ROI, with sponsor exports.",
      nextAction: "Set the reporting period, apply it, then generate sponsor exports when data is ready.",
    },
  },
  {
    prefix: SPONSOR_REPORT_ROI_SUMMARY_PATH,
    matchExact: true,
    explanation: {
      title: "ROI summary",
      summary:
        "Portfolio KPI view for review-cycle reduction, estimated effort saved, and export-ready artifacts across a reporting window.",
      nextAction:
        "Compare rolling and pilot-to-date windows, then review confidence notes before citing hours or dollars.",
    },
  },
  {
    prefix: "/insights/compare-two-reviews",
    explanation: {
      title: "Compare two reviews",
      summary:
        "Diff two architecture packages side by side — findings, severity shifts, and what changed between reviews.",
      nextAction: "Pick a baseline and a later review, then scan severity and finding deltas.",
    },
  },
  {
    prefix: GOVERNANCE_ALERTS_PATH,
    explanation: {
      title: "Alerts",
      summary:
        "Triage approval and architecture-risk signals raised from review findings that need acknowledgement or resolution.",
      nextAction: "Open an alert to acknowledge or resolve it, or configure alert rules when the inbox is empty.",
    },
  },
  {
    prefix: GOVERNANCE_ALERT_RULES_PATH,
    matchExact: true,
    explanation: {
      title: "Alert rules",
      summary:
        "Configure when completed reviews raise alerts, where notifications are delivered, composite rules, and simulation tests.",
      nextAction:
        "Set Conditions first, then open Notifications to add destinations, or use Test alerts to simulate behavior.",
    },
  },
  {
    prefix: GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH,
    matchExact: true,
    explanation: {
      title: "Needs attention",
      summary:
        "One inbox for unfinished work, assigned findings, alerts, and approvals that need action in this workspace.",
      nextAction: "Open the partition that matches your job, then follow the linked queue to clear or assign the work.",
    },
  },
  {
    prefix: GOVERNANCE_APPROVAL_QUEUE_PATH,
    matchExact: true,
    explanation: {
      title: "Approval queue",
      summary:
        "Submit, approve, or reject architecture-review decisions for this workspace with audit-friendly comments.",
      nextAction:
        "Load a review context, submit an approval request when ready, then approve or reject with a documented comment.",
    },
  },
  {
    prefix: GOVERNANCE_FINDINGS_PATH,
    matchExact: true,
    explanation: {
      title: "Findings",
      summary:
        "Track architecture risks from accepted findings, waivers, exceptions, and approval decisions.",
      nextAction: "Assign owners, review aging risks, and clear expiring exceptions.",
    },
  },
  {
    prefix: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    matchExact: true,
    explanation: {
      title: "Assigned to me",
      summary: "Open findings assigned to you for triage, evidence review, or resolution in this workspace.",
      nextAction: "Open each assigned finding, confirm evidence, then update status or route to the owning review.",
    },
  },
  {
    prefix: GOVERNANCE_DECISION_REGISTER_PATH,
    matchExact: true,
    explanation: {
      title: "Decision register",
      summary:
        "Browse architecture decisions locked with finalized review records — category, confidence, findings, and lineage.",
      nextAction: "Filter by date or category, open a decision card, then follow the linked review or findings when needed.",
    },
  },
  {
    prefix: GOVERNANCE_POLICY_PACKS_PATH,
    matchExact: true,
    explanation: {
      title: "Policy packs",
      summary:
        "Review policy pack rules, versions, and how packs apply to architecture reviews in this workspace.",
      nextAction:
        "Open a pack to inspect rules, compare packs in the library, or apply a pack when starting a review.",
    },
  },
  {
    prefix: GOVERNANCE_STANDARDS_AND_RULES_PATH,
    matchExact: true,
    explanation: {
      title: "Standards & rules",
      summary:
        "Inspect standards and policy rules applied to a review, including enforcement mode, source pack, and linked evidence.",
      nextAction:
        "Open linked findings or the evidence trail for a rule, then export a resolution snapshot when you need a citeable record.",
    },
  },
  {
    prefix: SIGNED_RECORDS_LIST_PATH,
    matchExact: true,
    explanation: {
      title: "Finalized review records",
      summary:
        "Browse finalized packages of decisions, findings, and downloadable artifacts for architecture reviews in this workspace.",
      nextAction:
        "Open a finalized review record, review decisions and findings, then export the bundle when downloads are ready.",
    },
  },
  {
    prefix: GOVERNANCE_AUDIT_PATH,
    matchExact: true,
    explanation: {
      title: "Audit trail",
      summary:
        "Search and export workspace audit events for reviews, approval actions, and integrity checks in this workspace.",
      nextAction:
        "Filter by review or action, refresh the trail, then export or open the related architecture review when needed.",
    },
  },
  {
    prefix: "/alerts",
    explanation: {
      title: "Alerts",
      summary:
        "Triage approval and architecture-risk signals raised from review findings that need acknowledgement or resolution.",
      nextAction: "Open an alert to acknowledge or resolve it, or configure alert rules when the inbox is empty.",
    },
  },
  {
    prefix: DIGESTS_HUB_PATH,
    explanation: {
      title: "Digests",
      summary:
        "Browse, subscribe to, and schedule architecture digest emails — the content cadence for sponsors and operators.",
      nextAction:
        "Start digests by setting an advisory scan cadence and adding recipients; the tabs cover history, recipients, and sponsor send cadence.",
    },
  },
  {
    prefix: AI_USAGE_SETTINGS_PATH,
    explanation: {
      title: "AI usage",
      summary:
        "Monitor AI token and dollar spend for this workspace against tenant budgets and review activity.",
      nextAction: "Scan current period usage, then adjust budget alerts or review high-cost architecture packages.",
    },
  },
  {
    prefix: SETTINGS_BILLING_PATH,
    explanation: {
      title: "Billing & plans",
      summary:
        "See the workspace plan, seat usage, and invoice history that govern what this tenant can run.",
      nextAction:
        "Confirm the active plan and seat usage, then open Invoices and receipts when you need charges or payment details.",
    },
  },
  {
    prefix: IMPACT_PREVIEW_PATH,
    explanation: {
      title: "Impact preview",
      summary:
        "Preview the expected impact of proposed architecture changes before you commit a new review.",
      nextAction: "Describe the proposed change, then inspect finding and risk shifts before starting a review.",
    },
  },
  {
    prefix: ARCHITECTURES_LIST_PATH,
    // The draft editor and the new-draft workspace own their own heading, lead, and status tag; the
    // inventory next action is also already complete once a draft is open.
    matchExact: true,
    explanation: {
      title: "Architectures",
      summary:
        "Inventory architecture drafts in this workspace — start a new draft or open one to prepare a review.",
      nextAction: "Open an architecture draft or create a new one when you are ready to start a review.",
    },
  },
  {
    prefix: "/administration/identity/sso-wizard",
    explanation: {
      title: "SSO wizard",
      summary:
        "Guided setup for enterprise single sign-on — connect your identity provider and map roles into ArchLucid.",
      nextAction:
        "Complete each wizard step, then run a sandbox sign-in test with sample claim values on the Verify claim mapping step to verify claim-to-role mapping.",
    },
  },
  {
    prefix: "/administration/identity-providers/oidc",
    explanation: {
      title: "OIDC/JWT status",
      summary:
        "Review OpenID Connect authority, audience, discovery validation, and role claim mapping for this workspace.",
      nextAction:
        "Confirm discovery status and authority or audience values, then open diagnostics if validation has not been attempted.",
    },
  },
  {
    prefix: "/administration/identity-providers/saml",
    explanation: {
      title: "SAML configuration",
      summary:
        "Configure SAML metadata, issuer, and group-to-role mapping for every workspace in this organization.",
      nextAction:
        "Fetch IdP metadata, map at least one group, then test the saved mapping below. Saving stores configuration for the whole organization and does not switch anyone to SAML sign-in. For a guided setup with a sandbox sign-in test, use the",
      nextActionLinks: [
        {
          label: "SSO setup wizard",
          href: "/administration/identity/sso-wizard",
        },
      ],
    },
  },
  {
    prefix: "/administration/identity-providers/role-mapping",
    explanation: {
      title: "Role mapping status",
      summary:
        "Review how identity provider groups or claims map to ArchLucid workspace roles before broad SSO rollout.",
      nextAction: "Confirm claim sources and mapping status, then test with a non-production user from your IdP.",
    },
  },
  {
    prefix: "/administration/identity-providers",
    explanation: {
      title: "SSO and identity",
      summary: "Configure SAML/OIDC identity providers, role mapping, and diagnostics for enterprise authentication.",
      nextAction: "Choose SAML or OIDC, or open the SSO wizard if you are setting up for the first time.",
    },
  },
];

/** Exact governance hub paths opted into explain-this-view (detail routes stay page-owned). */
const GOVERNANCE_EXPLAIN_OPT_IN_EXACT_PATHS: ReadonlySet<string> = new Set([
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  SIGNED_RECORDS_LIST_PATH,
  GOVERNANCE_AUDIT_PATH,
]);

/**
 * Alerts inbox, alert rules, and governance hub queues are opted in. Risk exceptions keep their own
 * layer guidance and governance approval banner, so a shell banner there repeats guidance the page already owns.
 */
function isGovernanceExplainOptIn(path: string): boolean {
  if (path === GOVERNANCE_ALERTS_PATH || path.startsWith(`${GOVERNANCE_ALERTS_PATH}/`)) {
    return true;
  }

  if (path === GOVERNANCE_ALERT_RULES_PATH || path.startsWith(`${GOVERNANCE_ALERT_RULES_PATH}/`)) {
    return true;
  }

  return GOVERNANCE_EXPLAIN_OPT_IN_EXACT_PATHS.has(path);
}

/** Returns compact orientation copy only when the route does not already own header guidance. */
export function routeViewExplanationForPathname(
  pathname: string,
  options?: {
    readonly isAiUsageQuietEmptyPeriod?: boolean;
    readonly impactPreviewPageState?: ImpactPreviewPageState | "unknown";
    readonly search?: string | null;
  },
): RouteViewExplanation | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (path === DIGESTS_HUB_PATH || path.startsWith(`${DIGESTS_HUB_PATH}/`)) {
    const tab = digestsHubTabFromLocation(path, new URLSearchParams(options?.search ?? "").get("tab"));

    if (tab === "subscriptions" || tab === "get-started") {
      return null;
    }
  }

  // Most approval surfaces own orientation via page headers; selected governance hubs are opted in.
  if (path.startsWith("/governance")) {
    if (!isGovernanceExplainOptIn(path)) {
      return null;
    }
  }

  if (path === "/insights/evidence-graph" || path.startsWith("/insights/evidence-graph/")) {
    return null;
  }

  if (path === "/administration/identity-providers/diagnostics") {
    return null;
  }

  if (path === "/administration/identity-providers") {
    return null;
  }

  const sorted = [...ROUTE_VIEW_EXPLANATIONS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (routeMatchesExplanationRow(path, row)) {
      if (row.prefix === AI_USAGE_SETTINGS_PATH && options?.isAiUsageQuietEmptyPeriod === true) {
        return {
          ...row.explanation,
          nextAction:
            "Confirm your monthly AI budget cap below, then open billing when you need plan or invoice details.",
        };
      }

      // Blocked impact-preview states render their own recovery card, and "unknown" means the page
      // has not reported yet (SSR and first paint) — showing orientation there flashes guidance that
      // contradicts the recovery CTA and then retracts it.
      if (row.prefix === IMPACT_PREVIEW_PATH && (options?.impactPreviewPageState ?? "unknown") !== "ready") {
        return null;
      }

      return row.explanation;
    }
  }

  return null;
}

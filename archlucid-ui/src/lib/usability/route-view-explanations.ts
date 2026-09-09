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
import { ARCHITECTURES_LIST_PATH, REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import { CLOUD_CONNECTIONS_CANONICAL_PATH } from "@/lib/cloud-connections-evidence-copy";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { DIGESTS_HUB_PATH, digestsHubTabFromLocation } from "@/lib/digests-route-paths";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import type { ImpactPreviewPageState } from "@/lib/impact-preview-page-types";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { NOTIFICATION_PREFERENCE_CENTER_PATH } from "@/lib/notification-preference-center";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import {
  SETTINGS_ROOT_PATH,
  SETTINGS_SECURITY_TRUST_PATH,
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

/**
 * Only the alerts inbox is opted in. Risk exceptions keep their own layer guidance and governance
 * approval banner, so a shell banner there repeats guidance the page already owns.
 */
function isGovernanceExplainOptIn(path: string): boolean {
  return path === GOVERNANCE_ALERTS_PATH || path.startsWith(`${GOVERNANCE_ALERTS_PATH}/`);
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

  // Most approval surfaces own orientation via page headers; only the alerts inbox is opted in.
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

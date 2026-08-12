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
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import { DIGESTS_HUB_PATH, digestsHubTabFromLocation } from "@/lib/digests-route-paths";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";

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

const ROUTE_VIEW_EXPLANATIONS: readonly { prefix: string; explanation: RouteViewExplanation }[] = [
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
        "Triage governance and architecture-risk signals raised from review findings that need acknowledgement or resolution.",
      nextAction: "Open an alert to acknowledge or resolve it, or configure alert rules when the inbox is empty.",
    },
  },
  {
    prefix: "/alerts",
    explanation: {
      title: "Alerts",
      summary:
        "Triage governance and architecture-risk signals raised from review findings that need acknowledgement or resolution.",
      nextAction: "Open an alert to acknowledge or resolve it, or configure alert rules when the inbox is empty.",
    },
  },
  {
    prefix: DIGESTS_HUB_PATH,
    explanation: {
      title: "Digests",
      summary:
        "Browse, subscribe to, and schedule architecture digest emails — the content cadence for sponsors and operators.",
      nextAction: "Open Browse for recent digests, Subscriptions to manage recipients, or Schedule for email cadence.",
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
    explanation: {
      title: "Architecture drafts",
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
      nextAction: "Complete each wizard step, then verify sign-in with a test user from your IdP.",
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
    readonly search?: string | null;
  },
): RouteViewExplanation | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (path === DIGESTS_HUB_PATH || path.startsWith(`${DIGESTS_HUB_PATH}/`)) {
    const tab = digestsHubTabFromLocation(path, new URLSearchParams(options?.search ?? "").get("tab"));

    if (tab === "subscriptions") {
      return null;
    }
  }

  // Most governance surfaces own orientation via page headers; only the alerts inbox is opted in.
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
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      if (row.prefix === AI_USAGE_SETTINGS_PATH && options?.isAiUsageQuietEmptyPeriod === true) {
        return {
          ...row.explanation,
          nextAction:
            "Confirm your monthly AI budget cap below, then open billing when you need plan or invoice details.",
        };
      }

      return row.explanation;
    }
  }

  return null;
}

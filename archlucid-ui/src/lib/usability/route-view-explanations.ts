/**
 * Plain-language route orientation copy ("explain this page in ~30 seconds").
 * Routes with OperatorPageHeader / layer strips / dense governance headers return `null`
 * unless explicitly opted into the table below (TB-2216 / TB-2257).
 */

export type RouteViewExplanation = {
  readonly title: string;
  readonly summary: string;
  readonly nextAction: string;
};

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
} from "@/lib/governance/governance-route-paths";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";

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
    prefix: GOVERNANCE_EXCEPTIONS_PATH,
    explanation: {
      title: "Exceptions",
      summary:
        "Track accepted risk exceptions against findings — time-bounded waivers that stay visible in the governance trail.",
      nextAction: "Review open exceptions, renew or close ones that expired, or open the linked finding.",
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
        "See the workspace plan, seats, and invoice settings that govern what this tenant can run.",
      nextAction: "Confirm the active plan, then open plan details or billing contacts when something looks wrong.",
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
    prefix: "/administration/identity-providers",
    explanation: {
      title: "SSO and identity",
      summary: "Configure SAML/OIDC identity providers, role mapping, and diagnostics for enterprise authentication.",
      nextAction: "Choose SAML or OIDC, or open the SSO wizard if you are setting up for the first time.",
    },
  },
];

function isGovernanceExplainOptIn(path: string): boolean {
  const isAlerts =
    path === GOVERNANCE_ALERTS_PATH || path.startsWith(`${GOVERNANCE_ALERTS_PATH}/`);
  const isExceptions =
    path === GOVERNANCE_EXCEPTIONS_PATH || path.startsWith(`${GOVERNANCE_EXCEPTIONS_PATH}/`);

  return isAlerts || isExceptions;
}

/** Returns compact orientation copy only when the route does not already own header guidance. */
export function routeViewExplanationForPathname(pathname: string): RouteViewExplanation | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  // Most governance surfaces own orientation via page headers; alerts and exceptions are opted in.
  if (path.startsWith("/governance")) {
    if (!isGovernanceExplainOptIn(path)) {
      return null;
    }
  }

  if (path === "/insights/evidence-graph" || path.startsWith("/insights/evidence-graph/")) {
    return null;
  }

  const sorted = [...ROUTE_VIEW_EXPLANATIONS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.explanation;
    }
  }

  return null;
}

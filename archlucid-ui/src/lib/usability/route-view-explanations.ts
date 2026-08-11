/**
 * Plain-language route orientation copy ("explain this page in ~30 seconds").
 * Routes with OperatorPageHeader / layer strips / dense governance headers return `null`
 * unless explicitly opted into the table below (TB-2216).
 */

export type RouteViewExplanation = {
  readonly title: string;
  readonly summary: string;
  readonly nextAction: string;
};

import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance-route-paths";

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
  {
    // Exact `/` only — matching uses equality or `${prefix}/`, so this does not swallow other routes.
    prefix: "/",
    explanation: {
      title: "Home",
      summary:
        "Workspace overview — recent reviews, pilot progress, and the next action for your architecture packages.",
      nextAction: "Open a recent review or start a new architecture review from the primary CTA.",
    },
  },
];

/** Returns compact orientation copy only when the route does not already own header guidance. */
export function routeViewExplanationForPathname(pathname: string): RouteViewExplanation | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  // Most governance surfaces own orientation via page headers; alerts are opted into the SoT table.
  if (path.startsWith("/governance")) {
    const isAlerts =
      path === GOVERNANCE_ALERTS_PATH || path.startsWith(`${GOVERNANCE_ALERTS_PATH}/`);

    if (!isAlerts) {
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
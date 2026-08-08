import { EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/executive-dashboard-route";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";

import { EXECUTIVE_ROI_DASHBOARD_PATHS } from "./helpers/executive-roi-dashboard";
import { comparePairSearchParams } from "./helpers/operator-journey";
import {
  SCREENSHOT_FINDING_ID,
  SCREENSHOT_LEFT_RUN_ID,
  SCREENSHOT_RIGHT_RUN_ID,
  SHOWCASE_DEMO_RUN_ID,
} from "./fixtures";

export type UxAuditShellMode = "buyer" | "operator" | "marketing";

export type UxAuditRouteEntry = {
  slug: string;
  href: string;
  persona: string;
};

const showcaseRunEnc = encodeURIComponent(SHOWCASE_DEMO_RUN_ID);
const showcaseFindingEnc = encodeURIComponent(SCREENSHOT_FINDING_ID);

/** Persona-mapped operator/buyer shell routes — one PNG per slug in buyer and operator modes. */
export const UX_AUDIT_OPERATOR_BUYER_ROUTES: readonly UxAuditRouteEntry[] = [
  { slug: "shell-reviews-list", href: "/architecture/reviews", persona: "all-personas" },
  { slug: "wizard-new-review", href: "/architecture/reviews/new", persona: "enterprise-architect" },
  { slug: "run-detail", href: `/architecture/reviews/${showcaseRunEnc}`, persona: "enterprise-architect" },
  { slug: "provenance", href: `/architecture/reviews/${showcaseRunEnc}/provenance`, persona: "enterprise-architect" },
  {
    slug: "compare",
    href: `/insights/compare-two-reviews?${comparePairSearchParams(SCREENSHOT_LEFT_RUN_ID, SCREENSHOT_RIGHT_RUN_ID)}`,
    persona: "vp-engineering",
  },
  { slug: "graph", href: `/insights/evidence-graph?runId=${showcaseRunEnc}`, persona: "vp-engineering" },
  {
    slug: "finding-detail",
    href: `/architecture/reviews/${showcaseRunEnc}/findings/${showcaseFindingEnc}`,
    persona: "vp-engineering",
  },
  { slug: "trust", href: "/trust", persona: "security-architect" },
  { slug: "settings-security-trust", href: "/administration/security-trust", persona: "security-architect" },
  { slug: "policy-packs", href: "/governance/policy-packs", persona: "security-architect" },
  { slug: "governance", href: "/governance/approval-queue", persona: "governance-reviewer" },
  { slug: "governance-dashboard", href: EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF, persona: "governance-reviewer" },
  {
    slug: "audit",
    href: auditTrailNavHref(SHOWCASE_DEMO_RUN_ID),
    persona: "governance-reviewer",
  },
  { slug: "executive-dashboard", href: EXECUTIVE_ROI_DASHBOARD_PATHS.operator, persona: "cto-cio" },
];

/** Public marketing entry points — captured once under `marketing/` (no operator rebuild). */
export const UX_AUDIT_MARKETING_ROUTES: readonly UxAuditRouteEntry[] = [
  { slug: "welcome", href: "/welcome", persona: "prospect" },
  { slug: "why", href: "/why", persona: "prospect" },
];

export const UX_AUDIT_OPERATOR_BUYER_ROUTE_COUNT = UX_AUDIT_OPERATOR_BUYER_ROUTES.length;
export const UX_AUDIT_MARKETING_ROUTE_COUNT = UX_AUDIT_MARKETING_ROUTES.length;
export const UX_AUDIT_EXPECTED_PNG_TOTAL =
  UX_AUDIT_OPERATOR_BUYER_ROUTE_COUNT * 2 + UX_AUDIT_MARKETING_ROUTE_COUNT;

export function resolveUxAuditShellMode(projectName: string): UxAuditShellMode | null {
  if (projectName.includes("marketing")) {
    return "marketing";
  }

  if (projectName.includes("operator")) {
    return "operator";
  }

  if (projectName.includes("ux-audit")) {
    return "buyer";
  }

  return null;
}

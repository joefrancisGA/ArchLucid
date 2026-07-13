import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { resolvePolicyPackDetailBreadcrumbLabel } from "@/lib/policy-pack-detail-resolver";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";
import { pathMatchesCloudConnections } from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { resolveNewReviewWizardBreadcrumbLabel } from "@/lib/operator-nav-labels";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";
import {
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type GetBreadcrumbsOptions = {
  /** Buyer-polished shell uses calmer create-flow labels on the wizard path. */
  readonly buyerPolishedShell?: boolean;
  /**
   * When set (e.g. `runId` on graph, audit, ask, search, `/governance`, or `/governance/findings`),
   * buyer-polished shell can insert the active review package title after **Overview**.
   */
  readonly queryRunId?: string;
  /** Persisted reviews list href (filters) for return navigation from detail pages. */
  readonly reviewsListReturnHref?: string;
};

function newReviewWizardCrumbLabel(): string {
  return resolveNewReviewWizardBreadcrumbLabel();
}
const BUYER_HUB_RUN_SCOPED_SEGMENTS = new Set<string>([
  "graph",
  "audit",
  "ask",
  "governance",
  "search",
]);

/** Governance routes that mirror review workflow context when `runId` is on the query string. */
const BUYER_GOVERNANCE_RUN_SCOPED_PATHS = new Set<string>(["/governance/findings"]);

const SEGMENT_LABELS: Record<string, string> = {
  onboarding: OPERATOR_NAV_LINK_LABELS.onboarding,
  reviews: "Review packages",
  new: "New request",
  graph: "Graph",
  compare: "Compare",
  replay: "Validate review package",
  ask: "Ask",
  search: "Search",
  advisory: "Advisory",
  "recommendation-learning": OPERATOR_NAV_LINK_LABELS.recommendationTuning,
  "product-learning": OPERATOR_NAV_LINK_LABELS.pilotFeedback,
  planning: "Improvement planning",
  "evolution-review": "Impact preview",
  "advisory-scheduling": "Schedules",
  digests: "Digests",
  "digest-subscriptions": "Subscriptions",
  alerts: "Alerts",
  "alert-rules": "Alert rules",
  "alert-routing": "Alert routing",
  "composite-alert-rules": "Composite rules",
  "alert-simulation": "Alert simulation",
  "alert-tuning": "Alert tuning",
  "policy-packs": "Policy packs",
  "first-30-days": "Governance setup",
  "governance-resolution": OPERATOR_NAV_LINK_LABELS.governanceResolution,
  governance: "Governance",
  findings: "Findings",
  dashboard: "Dashboard",
  audit: "Audit trail",
  manifests: "Signed review records",
  "signed-records": "Signed review records",
  provenance: "Evidence provenance",
  "value-report": "Value report",
  pilot: BUYER_TERMINOLOGY.evaluationValueReport,
  roi: "ROI summary",
  "approval-requests": "Approval requests",
  lineage: "Lineage",
  auth: "Auth",
  signin: "Sign in",
  callback: "Callback",
  plans: "Plans",
  settings: "Settings",
  billing: "Billing & plans",
  integrations: "Integrations",
  itsm: "ITSM",
  jira: "Jira",
  "azure-boards": "Azure Boards",
  servicenow: "ServiceNow",
  slack: "Slack",
  teams: "Teams",
  webhooks: "Webhooks",
  scope: "Workspace and scope",
  "how-it-works": "How ArchLucid works",
  "data-handling": "What ArchLucid does with your data",
};

/**
 * Builds breadcrumb trail from pathname. Last item has no href (current page).
 * Query strings are ignored for matching; dynamic segments use friendly labels.
 */
export function getBreadcrumbs(pathname: string, options?: GetBreadcrumbsOptions): BreadcrumbItem[] {
  const normalized = pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalized === "/") {
    return [{ label: OPERATOR_NAV_LINK_LABELS.home }];
  }

  if (normalized === "/dashboard") {
    return [{ label: OPERATOR_NAV_LINK_LABELS.portfolioOverview }];
  }

  // Product path: wizard crumb only — sidebar nav covers workspace overview.
  if (normalized === "/reviews/new") {
    return [{ label: newReviewWizardCrumbLabel() }];
  }

  const governanceRunTrail = tryBuildGovernanceRunScopedBreadcrumbs(normalized, options);

  if (governanceRunTrail !== null) {
    return governanceRunTrail;
  }

  if (normalized === "/audit" || normalized.startsWith("/audit/")) {
    const runId = options?.queryRunId?.trim();

    if (runId === undefined || runId.length === 0) {
      return [
        { label: "Governance", href: "/governance" },
        { label: "Audit trail" },
      ];
    }
  }

  // Cloud connection help — avoid generic multi-cloud breadcrumb segments.
  if (
    normalized === "/help/cloud-connections/azure" ||
    normalized === "/help/cloud-connections-azure" ||
    normalized === "/help/cloud-connections/aws" ||
    normalized === "/help/cloud-connections-aws" ||
    normalized === "/help/cloud-connections/gcp" ||
    normalized === "/help/cloud-connections-gcp"
  ) {
    return [
      { label: "Help", href: "/help" },
      { label: OPERATOR_NAV_LINK_LABELS.cloudConnections },
    ];
  }

  // Azure cloud connection lives under Integrations nav — not Settings admin chrome.
  if (pathMatchesCloudConnections(normalized)) {
    return [
      { label: OPERATOR_NAV_GROUP_LABELS.integrations, href: "/integrations/readiness" },
      { label: OPERATOR_NAV_LINK_LABELS.cloudConnections },
    ];
  }

  if (normalized === "/settings/tenant") {
    return [{ label: OPERATOR_NAV_LINK_LABELS.workspaceSettings }];
  }

  if (normalized === "/settings/tenant/recycle-bin") {
    return [
      { label: OPERATOR_NAV_LINK_LABELS.workspaceSettings, href: "/settings/tenant" },
      { label: "Projects recycle bin" },
    ];
  }

  if (normalized === "/settings/identity/sso-wizard") {
    return [
      { label: "Settings", href: "/settings" },
      { label: "Identity providers", href: "/settings/identity-providers" },
      { label: "Configure SSO" },
    ];
  }

  const items: BreadcrumbItem[] = [];
  const rawSegments = normalized.split("/").filter(Boolean);

  if (rawSegments.length === 0) {
    return items;
  }

  // `/governance/policy-packs/[id]` is governance-scoped pack tooling (TB-405 canonical list + detail).
  const governancePolicyPacksPrefix = GOVERNANCE_POLICY_PACKS_PATH;

  if (normalized === governancePolicyPacksPrefix || normalized === `${governancePolicyPacksPrefix}/`) {
    return [...items, { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH }];
  }

  if (normalized.startsWith(`${governancePolicyPacksPrefix}/`)) {
    const afterSlash = normalized.slice(governancePolicyPacksPrefix.length + 1).replace(/\/$/, "");
    const idSegment = afterSlash.split("/")[0] ?? "";

    if (idSegment.length === 0) {
      return [...items, { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH }];
    }

    const lastLabel = resolvePolicyPackDetailBreadcrumbLabel(idSegment, null);

    return [
      ...items,
      { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
      { label: lastLabel },
    ];
  }

  let cumulative = "";

  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i];
    cumulative += `/${segment}`;
    const isLast = i === rawSegments.length - 1;

    const label = labelForSegment(segment, rawSegments, i, options);

    if (isLast) {
      items.push({ label });
    } else {
      let href = cumulative;

      if (segment === "reviews" && options?.reviewsListReturnHref !== undefined && options.reviewsListReturnHref.length > 0) {
        href = options.reviewsListReturnHref;
      }

      items.push({ label, href });
    }
  }

  return finalizeTrustRouteBreadcrumbs(items, normalized, options);
}

function injectReviewPackagePathCrumbs(
  items: BreadcrumbItem[],
  normalizedPath: string,
): BreadcrumbItem[] {
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments[0] !== "reviews" || segments.length < 3) {
    return items;
  }

  const runId = segments[1] ?? "";

  if (runId.length === 0 || runId === "new") {
    return items;
  }

  const packageTitle = resolveBuyerHubRunPackageTitle(runId) ?? "Review package";
  const reviewHref = `/reviews/${encodeURIComponent(runId)}`;

  return items.map((item, index) => {
    if (index === 0 || item.href !== reviewHref) {
      return item;
    }

    return {
      ...item,
      label: packageTitle,
      href: reviewHref,
    };
  });
}

function injectGovernanceLineageCrumbs(
  items: BreadcrumbItem[],
  normalizedPath: string,
): BreadcrumbItem[] {
  const segments = normalizedPath.split("/").filter(Boolean);

  if (
    segments.length !== 4 ||
    segments[0] !== "governance" ||
    segments[1] !== "approval-requests" ||
    segments[3] !== "lineage"
  ) {
    return items;
  }

  const requestId = segments[2] ?? "";
  const requestHref = `/governance/approval-requests/${encodeURIComponent(requestId)}`;
  const demoTitle = DEMO_PATH_SEGMENT_TITLES[requestId];

  return items.map((item) => {
    if (item.href === requestHref && demoTitle !== undefined) {
      return { ...item, label: demoTitle };
    }

    return item;
  });
}

function finalizeTrustRouteBreadcrumbs(
  items: BreadcrumbItem[],
  normalizedPath: string,
  options?: GetBreadcrumbsOptions,
): BreadcrumbItem[] {
  let next = injectBuyerShowcaseReviewPackageCrumb(items, normalizedPath, options);
  next = injectReviewPackagePathCrumbs(next, normalizedPath);
  next = injectGovernanceLineageCrumbs(next, normalizedPath);

  return next;
}

const BUYER_DEMO_PATH_SEGMENT_TITLES: Partial<Record<string, string>> = {
  "f0000001-0000-4000-8000-000000000001": "Sample finalized review record",
  "f0000002-0000-4000-8000-000000000002": "Review record (artifacts pending)",
  [SHOWCASE_STATIC_DEMO_MANIFEST_ID]: `${SHOWCASE_BUYER_REVIEW_TITLE} signed record`,
};

/** E2E / demo fixture ids in path segments — show realistic titles instead of slug-style labels. */
const DEMO_PATH_SEGMENT_TITLES: Record<string, string> = {
  "e2e-fixture-run-001": "Claims Intake Modernization",
  "e2e-fixture-left-run": "Baseline architecture review (compare)",
  "e2e-fixture-right-run": "Target architecture review (compare)",
  "f0000001-0000-4000-8000-000000000001": "Sample finalized review package",
  "f0000002-0000-4000-8000-000000000002": "Review package (artifacts pending)",
  [SHOWCASE_STATIC_DEMO_MANIFEST_ID]: "Claims Intake review package",
  "claims-intake-modernization": "Claims Intake Modernization",
  "e2e-plan-001": "Demonstration plan",
  "e2e-finding-001": "Demonstration finding",
  "e2e-approval-001": "Sample approval record",
  "e2e-policy-pack-001": "Demonstration policy pack",
  "phi-minimization-risk": "PHI Minimization Risk",
  "claims-intake-modernization-plan": "Claims Intake Modernization (demonstration plan)",
  "claims-intake-approval-001": "Claims Intake Modernization Review",
  "healthcare-claims-v3-pack": "Healthcare claims policy pack (demonstration)",
};

function resolveBuyerHubRunPackageTitle(runId: string): string | null {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return SHOWCASE_BUYER_REVIEW_TITLE;
  }

  const compareTitle = compareRunBuyerDisplayLabel(trimmed);

  if (compareTitle !== null) {
    return compareTitle;
  }

  const demoTitle = DEMO_PATH_SEGMENT_TITLES[trimmed];

  if (demoTitle !== undefined) {
    return demoTitle;
  }

  return null;
}

function injectBuyerShowcaseReviewPackageCrumb(
  items: BreadcrumbItem[],
  normalizedPath: string,
  options?: GetBreadcrumbsOptions,
): BreadcrumbItem[] {
  const runId = options?.queryRunId?.trim();

  if (options?.buyerPolishedShell !== true || runId === undefined || runId.length === 0) {
    return items;
  }

  const reviewTitle = resolveBuyerHubRunPackageTitle(runId);

  if (reviewTitle === null) {
    return items;
  }

  const normalizedNoTrailing = normalizedPath.replace(/\/$/, "") || "/";
  const rawSegments = normalizedPath.split("/").filter(Boolean);

  if (BUYER_GOVERNANCE_RUN_SCOPED_PATHS.has(normalizedNoTrailing)) {
    const reviewHref = `/reviews/${encodeURIComponent(runId)}`;

    return [
      { label: reviewTitle, href: reviewHref },
      ...items,
    ];
  }

  if (rawSegments.length !== 1) {
    return items;
  }

  const hub = rawSegments[0] ?? "";

  if (!BUYER_HUB_RUN_SCOPED_SEGMENTS.has(hub)) {
    return items;
  }

  const reviewHref = `/reviews/${encodeURIComponent(runId)}`;

  return [
    { label: reviewTitle, href: reviewHref },
    ...items,
  ];
}

function labelForSegment(
  segment: string,
  allSegments: string[],
  index: number,
  options?: GetBreadcrumbsOptions,
): string {
  const prev = index > 0 ? allSegments[index - 1] : "";
  const buyer = options?.buyerPolishedShell === true;

  if (segment === "dashboard" && prev === "governance") {
    return BUYER_TERMINOLOGY.governanceDashboard;
  }

  if (buyer && segment === "inspect") {
    return "Evidence trace";
  }

  if (segment === "findings" && prev === "governance") {
    return "Risk register";
  }

  if (segment === "risk-exceptions" && prev === "governance") {
    return "Risk exceptions";
  }

  if (buyer && segment === "findings") {
    return "Findings";
  }

  if (buyer === true && prev === "reviews") {
    const compareReviewsTitle = compareRunBuyerDisplayLabel(segment);

    if (compareReviewsTitle !== null) {
      return compareReviewsTitle;
    }
  }

  if (buyer === true && segment === SHOWCASE_STATIC_DEMO_RUN_ID && prev === "reviews") {
    return SHOWCASE_BUYER_REVIEW_TITLE;
  }


  if (prev === "policy-packs" && isInvalidDynamicRouteToken(segment)) {
    return "Policy pack detail";
  }

  if (prev === "policy-packs") {
    return resolvePolicyPackDetailBreadcrumbLabel(segment, null);
  }

  const demoTitle = buyer ? BUYER_DEMO_PATH_SEGMENT_TITLES[segment] ?? DEMO_PATH_SEGMENT_TITLES[segment] : DEMO_PATH_SEGMENT_TITLES[segment];

  if (
    demoTitle !== undefined &&
    (prev === "reviews" ||
      prev === "manifests" ||
      prev === "signed-records" ||
      prev === "showcase" ||
      prev === "findings" ||
      prev === "plans" ||
      prev === "approval-requests" ||
      prev === "policy-packs")
  ) {
    if (buyer && segment === "phi-minimization-risk") {
      return "PHI minimization finding (High)";
    }

    return demoTitle;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    if (prev === "reviews") {
      return "Review package";
    }

    if (prev === "manifests" || prev === "signed-records") {
      return SIGNED_MANIFEST_LABEL;
    }

    if (prev === "approval-requests") {
      return "Request";
    }

    if (prev === "plans") {
      return "Plan";
    }

    return "Detail";
  }

  if (/^[0-9a-f-]{16,}$/i.test(segment) && segment.includes("-")) {
    if (prev === "reviews") {
      return "Review package";
    }
  }

  const mapped = SEGMENT_LABELS[segment];

  if (mapped !== undefined && mapped !== null) {

    if (buyer === true && (segment === "manifests" || segment === "signed-records")) {
      return "Signed review records";
    }

    if (buyer === true && segment === "manifest") {
      return SIGNED_MANIFEST_LABEL;
    }

    if (buyer === true && segment === "reviews") {

      return "Review packages";
    }


    if (buyer === true && segment === "audit") {

      return "Audit trail";
    }


    if (buyer === true && segment === "graph") {

      return "Evidence graph";
    }

    if (buyer === true && segment === "search") {

      return "Search review evidence";
    }

    return mapped;
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

function resolveReviewsListBreadcrumbHref(options?: GetBreadcrumbsOptions): string {
  if (options?.reviewsListReturnHref !== undefined && options.reviewsListReturnHref.length > 0) {
    return options.reviewsListReturnHref;
  }

  return "/reviews";
}

function tryBuildGovernanceRunScopedBreadcrumbs(
  normalizedPath: string,
  options?: GetBreadcrumbsOptions,
): BreadcrumbItem[] | null {
  if (normalizedPath !== "/governance") {
    return null;
  }

  const runId = options?.queryRunId?.trim();

  if (runId === undefined || runId.length === 0) {
    return null;
  }

  const reviewsListHref = resolveReviewsListBreadcrumbHref(options);
  const packageTitle = resolveBuyerHubRunPackageTitle(runId) ?? "Review package";
  const reviewHref = `/reviews/${encodeURIComponent(runId)}`;

  return [
    { label: "Review packages", href: reviewsListHref },
    { label: packageTitle, href: reviewHref },
    { label: "Governance" },
  ];
}

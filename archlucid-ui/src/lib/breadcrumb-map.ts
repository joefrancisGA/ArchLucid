import {
  ARCHITECTURE_DRAFTS_LIST_LABEL,
  CREATE_ARCHITECTURE_LABEL,
} from "@/lib/architecture-workflow-labels";
import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
  parseArchitectureDraftIdFromPath,
  reviewDetailPath,
} from "@/lib/architecture-routes";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { isAskReviewQuestionsPath } from "@/lib/ask-review-questions-route";
import { isCompareTwoReviewsPath } from "@/lib/compare-two-reviews-route";
import { isEvidenceGraphPath } from "@/lib/evidence-graph-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { isSearchReviewEvidencePath } from "@/lib/search-review-evidence-route";
import { SPONSOR_REPORT_SECTION_LABEL, EXECUTIVE_SUMMARY_PAGE_TITLE } from "@/lib/sponsor-report-navigation";
import { resolvePolicyPackDetailBreadcrumbLabel } from "@/lib/policy-pack-detail-resolver";
import { ITSM_CONNECTORS_ADMIN_LABEL, ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm-connectors-admin-scope";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  LEGACY_AUDIT_PATH,
  pathMatchesGovernanceApprovalQueue,
  pathMatchesRoutePrefix,
} from "@/lib/governance-route-paths";
import {
  LEGACY_SIGNED_RECORDS_LIST_PATH,
  SIGNED_RECORDS_LIST_PATH,
} from "@/lib/signed-records-paths";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance-overview-copy";
import { ALERTS_CONFIGURATION_PAGE_TITLE } from "@/lib/alerts-page-copy";
import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import {
  pathMatchesCloudConnections,
  pathMatchesIntegrationsReadiness,
} from "@/lib/integrations-nav-paths";
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
   * When set (e.g. `runId` on evidence graph, audit, ask, search, approval queue, or `/governance/findings`),
   * buyer-polished shell can insert the active review title after **Overview**.
   */
  readonly queryRunId?: string;
  /** Persisted reviews list href (filters) for return navigation from detail pages. */
  readonly reviewsListReturnHref?: string;
};

function newReviewWizardCrumbLabel(): string {
  return resolveNewReviewWizardBreadcrumbLabel();
}

const BUYER_HUB_RUN_SCOPED_SEGMENTS = new Set<string>([
  "evidence-graph",
  "audit",
  "ask",
  "ask-review-questions",
  "governance",
  "search",
  "search-review-evidence",
  "compare",
  "compare-two-reviews",
]);

/** Governance routes that mirror review workflow context when `runId` is on the query string. */
const BUYER_GOVERNANCE_RUN_SCOPED_PATHS = new Set<string>(["/governance/findings"]);

const SEGMENT_LABELS: Record<string, string> = {
  onboarding: OPERATOR_NAV_LINK_LABELS.onboarding,
  "first-review-guide": OPERATOR_NAV_LINK_LABELS.onboarding,
  reviews: "Reviews",
  new: "New request",
  insights: OPERATOR_NAV_GROUP_LABELS.analysis,
  "evidence-graph": OPERATOR_NAV_LINK_LABELS.evidenceGraph,
  graph: OPERATOR_NAV_LINK_LABELS.evidenceGraph,
  compare: "Compare",
  "compare-two-reviews": OPERATOR_NAV_LINK_LABELS.compareTwoReviews,
  replay: "Validate review",
  ask: "Ask",
  "ask-review-questions": OPERATOR_NAV_LINK_LABELS.askReview,
  search: "Search",
  "search-review-evidence": OPERATOR_NAV_LINK_LABELS.searchEvidence,
  advisory: "Advisory",
  "advisory-scans": OPERATOR_NAV_LINK_LABELS.architectureAdvisory,
  "recommendation-learning": OPERATOR_NAV_LINK_LABELS.recommendationTuning,
  "internal-operations": "Internal Operations",
  internal: "Internal Operations",
  "product-learning": OPERATOR_NAV_LINK_LABELS.pilotFeedback,
  planning: "Improvement planning",
  "evolution-review": "Impact preview",
  "advisory-scheduling": "Schedules",
  digests: "Digests",
  "digest-subscriptions": "Subscriptions",
  alerts: "Alerts",
  "alert-rules": ALERTS_CONFIGURATION_PAGE_TITLE,
  "alert-routing": "Alert routing",
  "composite-alert-rules": "Composite rules",
  "alert-simulation": "Alert simulation",
  "alert-tuning": "Alert tuning",
  "policy-packs": "Policy packs",
  setup: "Governance setup",
  "governance-resolution": OPERATOR_NAV_LINK_LABELS.governanceResolution,
  governance: "Governance",
  findings: "Findings",
  dashboard: "Dashboard",
  audit: "Audit trail",
  manifests: "Signed review records",
  "signed-records": "Signed review records",
  provenance: "Evidence provenance",
  "value-report": SPONSOR_REPORT_SECTION_LABEL,
  "sponsor-report": SPONSOR_REPORT_SECTION_LABEL,
  "executive-summary": EXECUTIVE_SUMMARY_PAGE_TITLE,
  "pilot-outcomes": "Pilot outcomes",
  "roi-summary": "ROI summary",
  "architecture-scorecard": OPERATOR_NAV_LINK_LABELS.scorecard,
  scorecard: OPERATOR_NAV_LINK_LABELS.scorecard,
  pilot: "Pilot outcomes",
  roi: "ROI summary",
  "approval-requests": "Approval requests",
  "approval-queue": "Approval queue",
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
  "data-handling": "What ArchLucid does with your data",
  "first-architecture-review": "Your first architecture review",
  "developer-troubleshooting": "Engineering troubleshooting runbook",
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

  if (isEvidenceGraphPath(normalized)) {
    return injectBuyerShowcaseReviewPackageCrumb(
      [{ label: OPERATOR_NAV_LINK_LABELS.evidenceGraph }],
      normalized,
      options,
    );
  }

  if (isAskReviewQuestionsPath(normalized)) {
    return injectBuyerShowcaseReviewPackageCrumb(
      [{ label: OPERATOR_NAV_LINK_LABELS.askReview }],
      normalized,
      options,
    );
  }

  if (isSearchReviewEvidencePath(normalized)) {
    return injectBuyerShowcaseReviewPackageCrumb(
      [{ label: OPERATOR_NAV_LINK_LABELS.searchEvidence }],
      normalized,
      options,
    );
  }

  if (isCompareTwoReviewsPath(normalized)) {
    return injectBuyerShowcaseReviewPackageCrumb(
      [{ label: OPERATOR_NAV_LINK_LABELS.compareTwoReviews }],
      normalized,
      options,
    );
  }

  if (normalized === EXECUTIVE_DASHBOARD_HREF || normalized.startsWith(`${EXECUTIVE_DASHBOARD_HREF}/`)) {
    return [
      { label: "Architecture" },
      { label: OPERATOR_NAV_LINK_LABELS.portfolioOverview },
    ];
  }

  if (normalized === FIRST_REVIEW_GUIDE_PATH || normalized.startsWith(`${FIRST_REVIEW_GUIDE_PATH}/`)) {
    return [
      { label: "Architecture" },
      { label: OPERATOR_NAV_LINK_LABELS.onboarding },
    ];
  }

  if (normalized === "/internal/recommendation-learning") {
    return [
      { label: "Internal Operations", href: "/internal/health" },
      { label: "Recommendation Learning" },
    ];
  }

  if (normalized === "/internal/product-learning") {
    return [
      { label: "Internal Operations", href: "/internal/health" },
      { label: OPERATOR_NAV_LINK_LABELS.pilotFeedback },
    ];
  }

  if (normalized === ITSM_CONNECTORS_ADMIN_PATH) {
    return [
      { label: "Internal Operations", href: "/internal/health" },
      { label: "Integrations", href: "/internal/integrations" },
      { label: ITSM_CONNECTORS_ADMIN_LABEL },
    ];
  }

  if (normalized === REVIEWS_NEW_PATH || normalized === "/reviews/new") {
    return [{ label: newReviewWizardCrumbLabel() }];
  }

  if (normalized === ARCHITECTURES_LIST_PATH || normalized === "/architectures") {
    return [{ label: ARCHITECTURE_DRAFTS_LIST_LABEL }];
  }

  if (
    normalized === ARCHITECTURES_NEW_PATH
    || normalized === "/architectures/new"
    || normalized.startsWith(`${ARCHITECTURES_LIST_PATH}/`)
    || normalized.startsWith("/architectures/")
  ) {
    const architectureId = parseArchitectureDraftIdFromPath(normalized);

    if (
      normalized === ARCHITECTURES_NEW_PATH
      || normalized === "/architectures/new"
      || architectureId !== null
      || /^\/architectures\/[^/]+$/.test(normalized)
    ) {
      const listHref =
        normalized.startsWith("/architectures") && !normalized.startsWith("/architecture/")
          ? "/architectures"
          : ARCHITECTURES_LIST_PATH;

      return [
        { label: ARCHITECTURE_DRAFTS_LIST_LABEL, href: listHref },
        { label: CREATE_ARCHITECTURE_LABEL },
      ];
    }
  }

  if (normalized === GOVERNANCE_ALERT_RULES_PATH || normalized.startsWith(`${GOVERNANCE_ALERT_RULES_PATH}/`)) {
    return [
      { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
      { label: ALERTS_CONFIGURATION_PAGE_TITLE },
    ];
  }

  const governanceRunTrail = tryBuildGovernanceRunScopedBreadcrumbs(normalized, options);

  if (governanceRunTrail !== null) {
    return governanceRunTrail;
  }

  if (pathMatchesGovernanceApprovalQueue(normalized)) {
    return [{ label: GOVERNANCE_OVERVIEW_PAGE_TITLE }];
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_AUDIT_PATH)) {
    const runId = options?.queryRunId?.trim();

    if (runId === undefined || runId.length === 0) {
      return [
        { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: "Audit trail" },
      ];
    }
  }

  if (normalized === "/help/glossary") {
    return [
      { label: "Support", href: "/help" },
      { label: "Glossary" },
    ];
  }

  if (normalized === "/help/users-and-roles") {
    return [
      { label: "Support", href: "/help" },
      { label: "Users and roles" },
    ];
  }

  if (normalized === "/help/azure-permissions") {
    return [
      { label: "Support", href: "/help" },
      { label: OPERATOR_NAV_LINK_LABELS.cloudConnections, href: "/integrations/cloud-connections" },
      { label: "Azure permissions" },
    ];
  }

  if (normalized === "/help/cloud-connections/azure" || normalized === "/help/cloud-connections-azure") {
    return [
      { label: "Support", href: "/help" },
      { label: OPERATOR_NAV_LINK_LABELS.cloudConnections, href: "/integrations/cloud-connections" },
      { label: "Azure" },
    ];
  }

  if (
    normalized === "/help/cloud-connections/aws"
    || normalized === "/help/cloud-connections-aws"
    || normalized === "/help/cloud-connections/gcp"
    || normalized === "/help/cloud-connections-gcp"
  ) {
    return [
      { label: "Help", href: "/help" },
      { label: OPERATOR_NAV_LINK_LABELS.cloudConnections, href: "/integrations/cloud-connections" },
    ];
  }

  if (pathMatchesIntegrationsReadiness(normalized)) {
    return [
      { label: "Administration" },
      { label: OPERATOR_NAV_LINK_LABELS.integrationReadiness },
    ];
  }

  if (normalized === ADMINISTRATION_SYSTEM_HEALTH_PATH) {
    return [
      { label: "Administration" },
      { label: OPERATOR_NAV_LINK_LABELS.systemHealth },
    ];
  }

  if (pathMatchesCloudConnections(normalized)) {
    return [
      { label: OPERATOR_NAV_GROUP_LABELS.integrations },
      { label: OPERATOR_NAV_LINK_LABELS.cloudConnections },
    ];
  }

  // Hub-first (IA-016): the leaf is "Workspace settings" and parents to the searchable Settings index.
  if (normalized === "/administration/tenant") {
    return [
      { label: "Administration" },
      { label: "Settings", href: "/administration" },
      { label: OPERATOR_NAV_LINK_LABELS.workspaceSettings },
    ];
  }

  if (normalized === "/administration/billing") {
    return [
      { label: "Administration" },
      { label: "Settings", href: "/administration" },
      { label: "Billing & plans" },
    ];
  }

  if (normalized === "/administration/tenant/recycle-bin") {
    return [
      { label: "Settings", href: "/administration" },
      { label: OPERATOR_NAV_LINK_LABELS.workspaceSettings, href: "/administration/tenant" },
      { label: "Projects recycle bin" },
    ];
  }

  if (normalized === "/administration/identity/sso-wizard") {
    return [
      { label: "Settings", href: "/administration" },
      { label: "Identity providers", href: "/administration/identity-providers" },
      { label: "Configure SSO" },
    ];
  }

  if (normalized === "/administration/scim-provisioning") {
    return [
      { label: "Settings", href: "/administration" },
      { label: "Identity providers", href: "/administration/identity-providers" },
      { label: "SCIM provisioning" },
    ];
  }

  const items: BreadcrumbItem[] = [];
  const rawSegments = normalized.split("/").filter(Boolean);

  if (rawSegments.length === 0) {
    return items;
  }

  const governancePolicyPacksPrefix = GOVERNANCE_POLICY_PACKS_PATH;

  const signedRecordsPath =
    normalized === LEGACY_SIGNED_RECORDS_LIST_PATH || normalized.startsWith(`${LEGACY_SIGNED_RECORDS_LIST_PATH}/`)
      ? `${SIGNED_RECORDS_LIST_PATH}${normalized.slice(LEGACY_SIGNED_RECORDS_LIST_PATH.length)}`
      : normalized === SIGNED_RECORDS_LIST_PATH || normalized.startsWith(`${SIGNED_RECORDS_LIST_PATH}/`)
        ? normalized
        : null;

  if (signedRecordsPath !== null) {
    if (signedRecordsPath === SIGNED_RECORDS_LIST_PATH) {
      return [{ label: "Signed review records", href: SIGNED_RECORDS_LIST_PATH }];
    }

    const tail = signedRecordsPath.slice(SIGNED_RECORDS_LIST_PATH.length + 1);
    const segments = tail.split("/").filter(Boolean);
    const manifestId = segments[0] ?? "";

    if (manifestId.length === 0) {
      return [{ label: "Signed review records", href: SIGNED_RECORDS_LIST_PATH }];
    }

    const buyer = options?.buyerPolishedShell === true;
    const detailLabel = labelForSegment(
      manifestId,
      ["signed-records", manifestId],
      1,
      buyer ? { buyerPolishedShell: true } : undefined,
    );
    const crumbs: BreadcrumbItem[] = [
      { label: "Signed review records", href: SIGNED_RECORDS_LIST_PATH },
      { label: detailLabel },
    ];

    if (segments[1] === "artifacts" && (segments[2] ?? "").length > 0) {
      crumbs.push({ label: "Artifact" });
    }

    return crumbs;
  }

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

  // Skip the Architecture segment so `/architecture/reviews/...` crumbs start at Reviews.
  const skipArchitectureReviewsPrefix =
    rawSegments[0] === "architecture" && rawSegments[1] === "reviews";
  const trailSegments = skipArchitectureReviewsPrefix ? rawSegments.slice(1) : rawSegments;
  const cumulativePrefix = skipArchitectureReviewsPrefix ? "/architecture" : "";

  let cumulative = cumulativePrefix;

  for (let i = 0; i < trailSegments.length; i++) {
    const segment = trailSegments[i];
    cumulative += `/${segment}`;
    const isLast = i === trailSegments.length - 1;

    const label = labelForSegment(
      segment,
      skipArchitectureReviewsPrefix ? ["architecture", ...trailSegments] : trailSegments,
      skipArchitectureReviewsPrefix ? i + 1 : i,
      options,
    );

    if (isLast) {
      items.push({ label });
    } else {
      let href = cumulative;

      if (
        segment === "reviews"
        && options?.reviewsListReturnHref !== undefined
        && options.reviewsListReturnHref.length > 0
      ) {
        href = options.reviewsListReturnHref;
      }

      // Parent "Governance" crumb opens the Approval queue (bare `/governance` is not a page).
      if (cumulative === "/governance") {
        href = GOVERNANCE_APPROVAL_QUEUE_PATH;
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

  let runId = "";
  let reviewHref = "";

  if (segments[0] === "architecture" && segments[1] === "reviews" && segments.length >= 4) {
    runId = segments[2] ?? "";
    reviewHref = `${REVIEWS_LIST_PATH}/${encodeURIComponent(runId)}`;
  } else if (segments[0] === "reviews" && segments.length >= 3) {
    runId = segments[1] ?? "";
    reviewHref = reviewDetailPath(runId);
  } else {
    return items;
  }

  if (runId.length === 0 || runId === "new") {
    return items;
  }

  const packageTitle = resolveBuyerHubRunPackageTitle(runId) ?? "Review";

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
    segments.length !== 4
    || segments[0] !== "governance"
    || segments[1] !== "approval-requests"
    || segments[3] !== "lineage"
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
  "f0000001-0000-4000-8000-000000000001": "Sample finalized review",
  "f0000002-0000-4000-8000-000000000002": "Review (artifacts pending)",
  [SHOWCASE_STATIC_DEMO_MANIFEST_ID]: "Claims Intake review",
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
    const reviewHref = `${REVIEWS_LIST_PATH}/${encodeURIComponent(runId)}`;

    return [
      { label: reviewTitle, href: reviewHref },
      ...items,
    ];
  }

  const pathFromSegments = `/${rawSegments.join("/")}`;

  if (
    rawSegments.length !== 1
    && !isEvidenceGraphPath(pathFromSegments)
    && !isAskReviewQuestionsPath(pathFromSegments)
    && !isSearchReviewEvidencePath(pathFromSegments)
    && !isCompareTwoReviewsPath(pathFromSegments)
  ) {
    return items;
  }

  const hub = rawSegments[0] ?? "";

  const isRunScopedHub =
    BUYER_HUB_RUN_SCOPED_SEGMENTS.has(hub)
    || isEvidenceGraphPath(pathFromSegments)
    || isAskReviewQuestionsPath(pathFromSegments)
    || isSearchReviewEvidencePath(pathFromSegments)
    || isCompareTwoReviewsPath(pathFromSegments);

  if (!isRunScopedHub) {
    return items;
  }

  const reviewHref = `${REVIEWS_LIST_PATH}/${encodeURIComponent(runId)}`;

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

  if (buyer && (segment === "inspect" || segment === "evidence-trace")) {
    return "Evidence trace";
  }

  if (segment === "findings" && prev === "governance") {
    return OPERATOR_NAV_LINK_LABELS.findings;
  }

  if (segment === "exceptions" && prev === "governance") {
    return OPERATOR_NAV_LINK_LABELS.riskExceptions;
  }

  if (segment === "risk-exceptions" && prev === "governance") {
    return OPERATOR_NAV_LINK_LABELS.riskExceptions;
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

  const demoTitle = buyer
    ? BUYER_DEMO_PATH_SEGMENT_TITLES[segment] ?? DEMO_PATH_SEGMENT_TITLES[segment]
    : DEMO_PATH_SEGMENT_TITLES[segment];

  if (
    demoTitle !== undefined
    && (prev === "reviews"
      || prev === "manifests"
      || prev === "signed-records"
      || prev === "showcase"
      || prev === "findings"
      || prev === "plans"
      || prev === "approval-requests"
      || prev === "policy-packs")
  ) {
    if (buyer && segment === "phi-minimization-risk") {
      return "PHI minimization finding (High)";
    }

    return demoTitle;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    if (prev === "reviews") {
      return "Review";
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
      return "Review";
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
      return "Reviews";
    }

    if (buyer === true && segment === "audit") {
      return "Audit trail";
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

  return REVIEWS_LIST_PATH;
}

function tryBuildGovernanceRunScopedBreadcrumbs(
  normalizedPath: string,
  options?: GetBreadcrumbsOptions,
): BreadcrumbItem[] | null {
  if (!pathMatchesGovernanceApprovalQueue(normalizedPath)) {
    return null;
  }

  const runId = options?.queryRunId?.trim();

  if (runId === undefined || runId.length === 0) {
    return null;
  }

  const reviewsListHref = resolveReviewsListBreadcrumbHref(options);
  const packageTitle = resolveBuyerHubRunPackageTitle(runId) ?? "Review";
  const reviewHref = `${REVIEWS_LIST_PATH}/${encodeURIComponent(runId)}`;

  return [
    { label: "Reviews", href: reviewsListHref },
    { label: packageTitle, href: reviewHref },
    { label: GOVERNANCE_OVERVIEW_PAGE_TITLE },
  ];
}

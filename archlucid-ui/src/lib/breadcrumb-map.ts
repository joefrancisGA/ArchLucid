import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type GetBreadcrumbsOptions = {
  /** Buyer-polished shell uses calmer create-flow labels on the wizard path. */
  readonly buyerPolishedShell?: boolean;
};

function newReviewWizardCrumbLabel(buyerPolishedShell: boolean | undefined): string {
  return buyerPolishedShell === true ? "New review" : "New request";
}

const SEGMENT_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  reviews: "Architecture reviews",
  new: "New request",
  graph: "Graph",
  compare: "Compare",
  replay: "Replay",
  ask: "Ask",
  search: "Search",
  advisory: "Advisory",
  "recommendation-learning": "Learning",
  "product-learning": "Pilot feedback",
  planning: "Planning",
  "evolution-review": "Simulation review",
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
  "governance-resolution": "Governance resolution",
  governance: "Governance",
  findings: "Findings",
  dashboard: "Dashboard",
  audit: "Audit log",
  manifests: "Manifests",
  provenance: "Provenance",
  "value-report": "Value report",
  pilot: "Pilot report",
  roi: "ROI summary",
  "approval-requests": "Approval requests",
  lineage: "Lineage",
  auth: "Auth",
  signin: "Sign in",
  callback: "Callback",
  plans: "Plans",
  settings: "Settings",
  billing: "Billing & plans",
};

/**
 * Builds breadcrumb trail from pathname. Last item has no href (current page).
 * Query strings are ignored for matching; dynamic segments use friendly labels.
 */
export function getBreadcrumbs(pathname: string, options?: GetBreadcrumbsOptions): BreadcrumbItem[] {
  const normalized = pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalized === "/") {
    return [{ label: "Home" }];
  }

  if (normalized === "/dashboard") {
    return [
      { label: "Home", href: "/" },
      { label: "Executive summary" },
    ];
  }

  // Product path: skip the intermediate "Architecture reviews" crumb so first workflow reads Home / New request.
  if (normalized === "/reviews/new") {
    return [
      { label: "Home", href: "/" },
      { label: newReviewWizardCrumbLabel(options?.buyerPolishedShell) },
    ];
  }

  const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
  const rawSegments = normalized.split("/").filter(Boolean);

  if (rawSegments.length === 0) {
    return items;
  }

  // `/governance/policy-packs/[id]` is governance-scoped pack tooling; the registry is `/policy-packs`.
  // Do not link the "Governance" segment to `/governance` (approval workflow) — that confused screenshots
  // and operators expecting pack UX.
  const governancePolicyPacksPrefix = "/governance/policy-packs";

  if (normalized === governancePolicyPacksPrefix || normalized === `${governancePolicyPacksPrefix}/`) {
    return [...items, { label: "Policy packs", href: "/policy-packs" }];
  }

  if (normalized.startsWith(`${governancePolicyPacksPrefix}/`)) {
    const afterSlash = normalized.slice(governancePolicyPacksPrefix.length + 1).replace(/\/$/, "");
    const idSegment = afterSlash.split("/")[0] ?? "";

    if (idSegment.length === 0) {
      return [...items, { label: "Policy packs", href: "/policy-packs" }];
    }

    const allSegments = ["governance", "policy-packs", idSegment];
    const lastLabel = labelForSegment(idSegment, allSegments, 2, options);

    return [
      ...items,
      { label: "Policy packs", href: "/policy-packs" },
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
      items.push({ label, href: cumulative });
    }
  }

  return items;
}

/** E2E / demo fixture ids in path segments — show realistic titles instead of slug-style labels. */
const DEMO_PATH_SEGMENT_TITLES: Record<string, string> = {
  "e2e-fixture-run-001": "Claims Intake Modernization",
  "e2e-fixture-left-run": "Baseline architecture run (compare)",
  "e2e-fixture-right-run": "Target architecture run (compare)",
  "f0000001-0000-4000-8000-000000000001": "Sample finalized manifest",
  "f0000002-0000-4000-8000-000000000002": "Manifest (artifacts pending)",
  [SHOWCASE_STATIC_DEMO_MANIFEST_ID]: "Claims Intake package manifest",
  "claims-intake-modernization": "Claims Intake Modernization",
  "e2e-plan-001": "Demonstration plan",
  "e2e-finding-001": "Demonstration finding",
  "e2e-approval-001": "Demonstration approval",
  "e2e-policy-pack-001": "Demonstration policy pack",
  "phi-minimization-risk": "PHI minimization (demonstration finding)",
  "claims-intake-modernization-plan": "Claims Intake Modernization (demonstration plan)",
  "claims-intake-approval-001": "Claims Intake (demonstration approval)",
  "healthcare-claims-v3-pack": "Healthcare claims policy pack (demonstration)",
};

function labelForSegment(
  segment: string,
  allSegments: string[],
  index: number,
  options?: GetBreadcrumbsOptions,
): string {
  const prev = index > 0 ? allSegments[index - 1] : "";
  const buyer = options?.buyerPolishedShell === true;

  if (buyer && segment === "inspect") {
    return "Evidence trace";
  }

  if (buyer && segment === "findings") {
    return "Finding";
  }


  if (buyer === true && segment === SHOWCASE_STATIC_DEMO_RUN_ID && prev === "reviews") {


    return SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE;
  }


  if (prev === "policy-packs" && isInvalidDynamicRouteToken(segment)) {
    return "Policy pack detail";
  }

  const demoTitle = DEMO_PATH_SEGMENT_TITLES[segment];

  if (
    demoTitle !== undefined &&
    (prev === "reviews" ||
      prev === "manifests" ||
      prev === "showcase" ||
      prev === "findings" ||
      prev === "plans" ||
      prev === "approval-requests" ||
      prev === "policy-packs")
  ) {
    if (buyer && segment === "phi-minimization-risk") {
      return "High severity: PHI minimization risk";
    }

    return demoTitle;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    if (prev === "reviews") {
      return "Review detail";
    }

    if (prev === "manifests") {
      return "Manifest";
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
      return "Review detail";
    }
  }

  const mapped = SEGMENT_LABELS[segment];

  if (mapped !== undefined && mapped !== null) {

    if (buyer === true && segment === "reviews") {

      return "Reviews";
    }


    if (buyer === true && segment === "audit") {

      return "Audit Trail";
    }


    if (buyer === true && segment === "graph") {

      return "Evidence graph";
    }

    return mapped;
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

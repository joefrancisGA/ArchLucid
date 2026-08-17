import { ASK_REVIEW_QUESTIONS_PATH, LEGACY_ASK_PATH } from "@/lib/ask-review-questions-route";
import { COMPARE_TWO_REVIEWS_PATH, LEGACY_COMPARE_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH, LEGACY_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { ARCHITECTURE_SCORECARD_PATH, LEGACY_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { IMPACT_PREVIEW_PATH, LEGACY_EVOLUTION_REVIEW_PATH } from "@/lib/impact-preview-route";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import { PLANNING_PATH, LEGACY_INSIGHTS_PLANNING_PATH, LEGACY_PLANNING_PATH } from "@/lib/planning-route";
import { LEGACY_PRODUCT_LEARNING_PATH, PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import { LEGACY_SEARCH_PATH, SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { DIGESTS_HUB_PATH, LEGACY_DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";
import { RETIRED_PILOT_OUTCOMES_PATH, RETIRED_SPONSOR_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import {
  RETIRED_LOGIN_BOOKMARK_PATH,
  RETIRED_ONBOARD_BOOKMARK_PATH,
  RETIRED_ONBOARDING_START_BOOKMARK_PATH,
  RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH,
} from "@/lib/ui-route-traffic-retired-redirect-shims";
import { LEGACY_ONBOARDING_PATH } from "@/lib/first-review-guide-route";
import { LEGACY_GETTING_STARTED_PATH } from "@/lib/getting-started-help-guide-content";
import { isSplitSiteHostingEnabled, resolveAppSiteOrigin, resolvePublicSiteOrigin } from "@/lib/site-urls";

/** Extra marketing paths not always in the sitemap (noindex / funnel). */
const EXTRA_MARKETING_EXACT_PATHS: readonly string[] = [
  "/faq",
  "/quick-scan",
];

const EXTRA_MARKETING_PREFIXES: readonly string[] = ["/showcase/", "/signup/"];

/** Canonical operator paths for split-site host routing. */
const CANONICAL_OPERATOR_PATH_PREFIXES: readonly string[] = [
  "/auth/",
  "/architecture/reviews",
  "/architecture/architectures",
  "/architecture/first-review-guide",
  "/architecture/digests",
  "/governance",
  "/integrations",
  "/administration",
  "/internal",
  "/insights/sponsor-report",
  "/insights/roi-summary",
  "/help",
  "/why-archlucid",
  COMPARE_TWO_REVIEWS_PATH,
  "/internal/validate-route",
  "/sponsor",
  EVIDENCE_GRAPH_PATH,
  PATTERN_LIBRARY_PATH,
  PLANNING_PATH,
  PRODUCT_LEARNING_PATH,
  "/advisory-scheduling",
  SEARCH_REVIEW_EVIDENCE_PATH,
  "/demo",
  IMPACT_PREVIEW_PATH,
  DIGESTS_HUB_PATH,
  "/workspace",
  ASK_REVIEW_QUESTIONS_PATH,
  ARCHITECTURE_SCORECARD_PATH,
];

/**
 * Retired bookmark prefixes — no `next.config` redirect (IA batch 4), but split-host must still
 * forward these to the app origin so users land on the app 404 instead of marketing chrome.
 */
const LEGACY_OPERATOR_PATH_PREFIXES: readonly string[] = [
  "/reviews",
  "/runs",
  "/architectures",
  "/manifests",
  "/signed-records",
  "/alerts",
  "/policy-packs",
  "/audit",
  "/digest-subscriptions",
  "/value-report",
  LEGACY_COMPARE_PATH,
  LEGACY_GRAPH_PATH,
  LEGACY_PRODUCT_LEARNING_PATH,
  LEGACY_SEARCH_PATH,
  LEGACY_SCORECARD_PATH,
  LEGACY_ASK_PATH,
  LEGACY_EVOLUTION_REVIEW_PATH,
  LEGACY_DIGESTS_HUB_PATH,
  LEGACY_PLANNING_PATH,
  LEGACY_INSIGHTS_PLANNING_PATH,
  RETIRED_PILOT_OUTCOMES_PATH,
  RETIRED_SPONSOR_SUMMARY_PATH,
  RETIRED_LOGIN_BOOKMARK_PATH,
  RETIRED_ONBOARD_BOOKMARK_PATH,
  RETIRED_ONBOARDING_START_BOOKMARK_PATH,
  RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH,
  LEGACY_ONBOARDING_PATH,
  LEGACY_GETTING_STARTED_PATH,
];

const OPERATOR_PATH_PREFIXES: readonly string[] = [
  ...CANONICAL_OPERATOR_PATH_PREFIXES,
  ...LEGACY_OPERATOR_PATH_PREFIXES,
];

function hostnameFromOrigin(origin: string | null): string | null {
  if (origin == null) return null;

  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeRequestHost(hostHeader: string | null): string | null {
  if (hostHeader == null) return null;

  const trimmed = hostHeader.trim().toLowerCase();

  if (trimmed === "") return null;

  // Keep host:port so local split hosting (localhost:3000 vs :3001) matches
  // hostnameFromOrigin, which uses URL.host (includes non-default ports).
  try {
    return new URL(`http://${trimmed}`).host.toLowerCase();
  } catch {
    return trimmed;
  }
}

/** Treat www.example.com as matching example.com for marketing-host decisions. */
function hostsMatch(requestHost: string, configuredHost: string): boolean {
  if (requestHost === configuredHost) return true;

  if (requestHost === `www.${configuredHost}`) return true;

  if (configuredHost.startsWith("www.") && requestHost === configuredHost.slice(4)) return true;

  return false;
}

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix.endsWith("/")) return pathname === prefix.slice(0, -1) || pathname.startsWith(prefix);

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isMarketingOnlyPath(pathname: string): boolean {
  if (pathname === "/welcome" || pathname === "/pricing" || pathname === "/signup") return true;

  if (MARKETING_SITEMAP_PATHNAMES.includes(pathname)) return true;

  if (EXTRA_MARKETING_EXACT_PATHS.includes(pathname)) return true;

  for (const prefix of EXTRA_MARKETING_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  return false;
}

export function isOperatorPath(pathname: string): boolean {
  if (pathname === "/") return true;

  for (const prefix of OPERATOR_PATH_PREFIXES) {
    if (pathMatchesPrefix(pathname, prefix)) return true;
  }

  return false;
}

export type HostGateDecision =
  | { readonly kind: "next" }
  | { readonly kind: "redirect"; readonly location: string };

/**
 * When split hosting is configured, keep marketing paths on the public host and operator paths on the app host.
 * Marketing `/` redirects to `/welcome` on the same public origin (not to the app host).
 */
export function decideHostGateRedirect(input: {
  readonly hostHeader: string | null;
  readonly pathname: string;
  readonly search: string;
}): HostGateDecision {
  if (!isSplitSiteHostingEnabled()) return { kind: "next" };

  const publicOrigin = resolvePublicSiteOrigin();
  const appOrigin = resolveAppSiteOrigin();
  const requestHost = normalizeRequestHost(input.hostHeader);
  const publicHost = hostnameFromOrigin(publicOrigin);
  const appHost = hostnameFromOrigin(appOrigin);

  if (requestHost == null || publicHost == null || appHost == null || publicOrigin == null || appOrigin == null) {
    return { kind: "next" };
  }

  const pathAndQuery = `${input.pathname}${input.search}`;

  if (hostsMatch(requestHost, publicHost)) {
    if (input.pathname === "/") {
      return { kind: "redirect", location: `${publicOrigin}/welcome${input.search}` };
    }

    if (isOperatorPath(input.pathname)) {
      return { kind: "redirect", location: `${appOrigin}${pathAndQuery}` };
    }

    return { kind: "next" };
  }

  if (hostsMatch(requestHost, appHost)) {
    if (isMarketingOnlyPath(input.pathname)) {
      return { kind: "redirect", location: `${publicOrigin}${pathAndQuery}` };
    }

    return { kind: "next" };
  }

  return { kind: "next" };
}

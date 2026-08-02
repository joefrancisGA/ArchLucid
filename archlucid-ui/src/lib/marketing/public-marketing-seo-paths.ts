import { LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH } from "@/lib/legacy-architecture-graph-route";
import { LEGACY_ONBOARD_PATH } from "@/lib/legacy-onboard-route";
import { LEGACY_ONBOARDING_START_PATH } from "@/lib/legacy-onboarding-start-route";
import { LEGACY_QUICK_START_PATH } from "@/lib/legacy-quick-start-route";
import { LEGACY_SNAPSHOT_PATH_PREFIX } from "@/lib/legacy-snapshot-route";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/** Pathnames emitted in `app/sitemap.ts`. Prefix "/", no trailing slash. */
export const MARKETING_SITEMAP_PATHNAMES: readonly string[] = [
  "/welcome",
  "/pricing",
  "/why",
  "/see-it",
  "/trust",
  "/privacy",
  "/accessibility",
  "/security-trust",
  "/compliance-journey",
  "/signup",
  "/signup/verify",
  "/get-started",
  `/showcase/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
];

/**
 * Paths we ask generic crawlers to skip — operator shell, API-style routes, funnel auth, noindex previews.
 * Do not list "/" alone (RFC-style prefix rules would disallow the entire host).
 */
export const MARKETING_ROBOTS_DISALLOW_PREFIXES: readonly string[] = [
  "/auth/",
  "/api/",
  "/reviews/",
  "/runs/",
  "/manifests/",
  "/signed-records/",
  "/why-archlucid",
  "/compare",
  "/replay",
  "/executive/",
  "/alerts/",
  "/admin/",
  "/settings/",
  "/insights/evidence-graph",
  LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
  "/governance/",
  "/governance-resolution/",
  LEGACY_ONBOARD_PATH,
  LEGACY_ONBOARDING_START_PATH,
  LEGACY_QUICK_START_PATH,
  "/architecture/first-review-guide/",
  "/planning/",
  "/policy-packs/",
  "/product-learning/",
  "/internal-operations/recommendation-learning/",
  "/digest-subscriptions/",
  "/governance/advisory-scans",
  "/advisory-scheduling",
  "/integrations/",
  "/help",
  "/search",
  "/scorecard",
  "/insights/ask-review-questions",
  "/demo/",
  "/getting-started",
  "/evolution-review",
  "/audit",
  "/value-report",
  "/digests",
  "/workspace",
  "/v1",
  "/v2",
  "/administration/system-health",
  "/openapi/",
  "/swagger/",
  "/scalar/",
  "/metrics",
  "/live-demo",
  LEGACY_SNAPSHOT_PATH_PREFIX,
];

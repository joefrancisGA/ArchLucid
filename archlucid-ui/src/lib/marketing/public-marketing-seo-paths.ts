import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH } from "@/lib/legacy-architecture-graph-route";
import { LEGACY_QUICK_START_PATH } from "@/lib/legacy-quick-start-route";
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
  "/assurance-status",
  "/compliance-journey",
  "/signup",
  "/signup/verify",
  "/get-started",
  "/faq",
  `/showcase/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
];

/**
 * Paths we ask generic crawlers to skip — operator shell, API-style routes, funnel auth, noindex previews.
 * Do not list "/" alone (RFC-style prefix rules would disallow the entire host).
 */
export const MARKETING_ROBOTS_DISALLOW_PREFIXES: readonly string[] = [
  "/auth/",
  "/api/",
  "/architecture/reviews/",
  "/runs/",
  "/manifests/",
  "/governance/sealed-records/",
  "/why-archlucid",
  "/insights/compare-two-reviews",
  "/internal/validate-route",
  "/sponsor/",
  "/alerts/",
  "/admin/",
  "/internal/",
  "/administration/",
  EVIDENCE_GRAPH_PATH,
  "/governance/",
  "/governance/standards-and-rules/",
  LEGACY_QUICK_START_PATH,
  LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
  `${FIRST_REVIEW_GUIDE_PATH}/`,
  "/insights/improvement-planning/",
  "/internal/product-learning/",
  "/internal/recommendation-learning/",
  "/governance/advisory-scans",
  "/advisory-scheduling",
  "/integrations/",
  "/help",
  "/insights/search-review-evidence",
  "/insights/architecture-scorecard",
  "/insights/ask-review-questions",
  "/demo/",
  "/getting-started",
  "/insights/impact-preview",
  "/architecture/digests",
  "/digests",
  "/workspace",
  "/v1",
  "/v2",
  "/openapi/",
  "/swagger/",
  "/scalar/",
  "/metrics",
  "/snapshot",
];

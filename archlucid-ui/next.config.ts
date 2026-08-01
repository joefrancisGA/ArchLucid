import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true" || process.env.ANALYZE === "1",
});

/**
 * Baseline security headers for the operator shell. HSTS belongs on the TLS terminator
 * (e.g. Azure Front Door, App Gateway), not here — this app may run on HTTP in dev.
 */
/** Long-lived cache for fingerprinted Next.js build assets and static images. */
const immutableStaticAssetCacheControl = {
  key: "Cache-Control",
  value: "public, max-age=31536000, immutable",
} as const;

/**
 * Application shell / HTML documents must not be cached across deploys (TB-868).
 * Listed after this rule in `headers()`, `/_next/static` and `/images` override with immutable.
 */
const documentShellCacheControl = {
  key: "Cache-Control",
  value: "no-cache, no-store, max-age=0, must-revalidate",
} as const;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  /**
   * Baseline CSP: Next.js App Router still needs inline script/eval in dev and for some hydration paths;
   * tighten further with nonces when migrating to strict production-only CSP.
   */
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; " +
      // Microsoft Clarity (marketing only, consent-gated in UI): tag script host.
      `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ""} https://www.clarity.ms; style-src 'self' 'unsafe-inline'; ` +
      "img-src 'self' data: blob: https://c.bing.com; font-src 'self' data:; connect-src 'self' https: http://localhost:* ws://localhost:* wss://localhost:*",
  },
];

const skipStandaloneOutput =
  process.env.ARCHLUCID_SKIP_STANDALONE_OUTPUT === "1" ||
  process.env.ARCHLUCID_SKIP_STANDALONE_OUTPUT === "true";

const nextConfig: NextConfig = {
  env: {
    /** Mirrors Vite-style naming — exposed to client/server bundles for opt-in API mocks (see `sandbox-api-mocks`). */
    VITE_USE_SANDBOX_MOCKS: process.env.VITE_USE_SANDBOX_MOCKS ?? "",
  },
  /** Production/Docker `next build` must not typecheck Vitest-only roots (`testing/`, `vitest.*.ts`). IDE keeps `tsconfig.json`. */
  typescript: {
    tsconfigPath: "tsconfig.build.json",
  },
  // Soft-nav from heavy Overview was stuck on Next 16.2.x (RSC OK, URL never commits) under
  // loading.tsx — React reconciler fix ships in 16.3.0-preview+ (vercel/next.js#86151). Pin that line until 16.3 stable.
  reactStrictMode: true,
  devIndicators: false,
  // Standalone output copies only required node_modules into .next/standalone,
  // producing a self-contained deployment unit suitable for Docker / App Service.
  //
  // On some Windows setups, traced standalone copy hits ENOENT for
  // `page_client-reference-manifest.js` during `Collecting build traces` (upstream Next + NFT).
  // Docker/Linux builds are unaffected; set ARCHLUCID_SKIP_STANDALONE_OUTPUT=1 locally to finish `npm run build`.
  ...(skipStandaloneOutput ? {} : { output: "standalone" as const }),
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-label",
      "@radix-ui/react-progress",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-tooltip",
    ],
  },
  transpilePackages: ["reactflow"],
  async headers() {
    const securityHeaderRules = [{ source: "/:path*", headers: securityHeaders }];

    // `next dev` manages its own Cache-Control for these paths (recompiled assets/edited
    // images keep the same URL, unlike production's fingerprinted /_next/static output);
    // a year-long override here fights the dev server and can serve stale bundles/images.
    if (process.env.NODE_ENV === "development") {
      return securityHeaderRules;
    }

    return [
      {
        source: "/:path*",
        headers: [documentShellCacheControl],
      },
      {
        source: "/_next/static/:path*",
        headers: [immutableStaticAssetCacheControl],
      },
      {
        source: "/images/:path*",
        headers: [immutableStaticAssetCacheControl],
      },
      ...securityHeaderRules,
    ];
  },
  async redirects() {
    return [
      // /runs/* → /reviews/* (URL rename; permanent so search engines and bookmarks update)
      { source: "/runs", destination: "/reviews", permanent: true },
      { source: "/runs/:path*", destination: "/reviews/:path*", permanent: true },
      // Legacy manifest browser paths → canonical signed-records aliases (TB-399).
      { source: "/manifests", destination: "/signed-records", permanent: true },
      { source: "/manifests/:path*", destination: "/signed-records/:path*", permanent: true },
      { source: "/reviews/:id/manifest", destination: "/reviews/:id/signed-record", permanent: true },
      // Showcase manifest UUID canonicalizes to the friendly signed-record URL for buyer spine E2E.
      {
        source: "/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890",
        destination: "/reviews/claims-intake-modernization/signed-record",
        permanent: false,
      },
      {
        source: "/reviews/claims-intake-modernization/architecture",
        destination: "/reviews/claims-intake-modernization/signed-record",
        permanent: true,
      },
      // Governance route tree consolidation (TB-405).
      { source: "/policy-packs", destination: "/governance/policy-packs", permanent: true },
      { source: "/policy-packs/:path*", destination: "/governance/policy-packs/:path*", permanent: true },
      { source: "/governance-resolution", destination: "/governance/resolution", permanent: true },
      { source: "/governance-resolution/:path*", destination: "/governance/resolution/:path*", permanent: true },
      { source: "/audit", destination: "/governance/audit", permanent: true },
      { source: "/audit/:path*", destination: "/governance/audit/:path*", permanent: true },
      { source: "/alerts", destination: "/governance/alerts", permanent: true },
      { source: "/alerts/:path*", destination: "/governance/alerts/:path*", permanent: true },
      { source: "/alert-rules", destination: "/governance/alert-rules", permanent: false },
      // Alert routing legacy path (TB-1441) — next.config-only; no App Router stub pages.
      { source: "/alert-routing", destination: "/governance/alert-rules?tab=routing", permanent: true },
      // Advisory scans under Governance (TB-1124) — next.config-only; no App Router stub pages.
      { source: "/advisory", destination: "/governance/advisory-scans", permanent: true },
      { source: "/advisory/:path*", destination: "/governance/advisory-scans/:path*", permanent: true },
      { source: "/advisory-scheduling", destination: "/governance/advisory-scans?tab=schedules", permanent: true },
      // Governance setup (TB-1134) — next.config-only; no App Router stub pages.
      { source: "/governance/first-30-days", destination: "/governance/setup", permanent: true },
      { source: "/governance/first-30-days/:path*", destination: "/governance/setup/:path*", permanent: true },
      { source: "/digest-subscriptions", destination: "/digests?tab=subscriptions", permanent: true },
      { source: "/composite-alert-rules", destination: "/governance/alert-rules?tab=composite", permanent: false },
      { source: "/alert-simulation", destination: "/governance/alert-rules?tab=simulation", permanent: false },
      { source: "/alert-tuning", destination: "/governance/alert-rules?tab=simulation", permanent: false },
      { source: "/governance/alerts", destination: "/governance/alert-rules", has: [{ type: "query", key: "tab", value: "rules" }], permanent: false },
      { source: "/governance/alerts", destination: "/governance/alert-rules", has: [{ type: "query", key: "tab", value: "routing" }], permanent: false },
      { source: "/governance/alerts", destination: "/governance/alert-rules", has: [{ type: "query", key: "tab", value: "composite" }], permanent: false },
      { source: "/governance/alerts", destination: "/governance/alert-rules", has: [{ type: "query", key: "tab", value: "simulation" }], permanent: false },
      { source: "/alerts", destination: "/governance/alert-rules", has: [{ type: "query", key: "tab", value: "rules" }], permanent: false },
      { source: "/alerts", destination: "/governance/alert-rules", has: [{ type: "query", key: "tab", value: "routing" }], permanent: false },
      { source: "/alerts", destination: "/governance/alert-rules", has: [{ type: "query", key: "tab", value: "composite" }], permanent: false },
      { source: "/alerts", destination: "/governance/alert-rules", has: [{ type: "query", key: "tab", value: "simulation" }], permanent: false },
      { source: "/settings/webhooks", destination: "/integrations/webhooks", permanent: true },
      // Integrations route namespace reconciliation (TB-407).
      // Pre-release: former /integrations/itsm hub, /integrations/operations, and
      // /integrations/readiness were removed (no redirects). OAuth callback stays at
      // /integrations/itsm/oauth/callback. Canonical hub: /administration/connection-status.

      { source: "/settings/cloud-connections", destination: "/integrations/cloud-connections", permanent: true },
      { source: "/settings/cloud-connections/:path*", destination: "/integrations/cloud-connections/:path*", permanent: true },
      { source: "/admin/ai-usage-cost", destination: "/settings/ai-usage", permanent: true },
      { source: "/settings/cost-reporting", destination: "/settings/ai-usage", permanent: true },
      { source: "/settings/cost-reporting/:path*", destination: "/settings/ai-usage/:path*", permanent: true },
      // Administration route namespace reconciliation (TB-406).
      { source: "/workspace/security-trust", destination: "/settings/security-trust", permanent: true },
      { source: "/workspace/security-trust/:path*", destination: "/settings/security-trust/:path*", permanent: true },
      { source: "/admin/users", destination: "/settings/users", permanent: true },
      { source: "/admin/users/:path*", destination: "/settings/users/:path*", permanent: true },
      { source: "/admin/support", destination: "/settings/support", permanent: true },
      { source: "/admin/support/:path*", destination: "/settings/support/:path*", permanent: true },
      // Administration users/roles nav consolidation (TB-522).
      { source: "/settings/roles", destination: "/settings/users?tab=roles", permanent: true },
      { source: "/settings/roles/:path*", destination: "/settings/users/:path*", permanent: true },
      // Executive dashboard consolidation (TB-608) — same ExecutiveRoiDashboardPageView content as
      // the operator-shell executive dashboard nav item; the standalone executive-chrome page is retired.
      { source: "/dashboard", destination: "/architecture/executive-dashboard", permanent: true },
      { source: "/dashboard/:path*", destination: "/architecture/executive-dashboard/:path*", permanent: true },
      { source: "/executive/dashboard", destination: "/architecture/executive-dashboard", permanent: true },
      // Cross-tenant portfolio page retired — portfolio overview nav already targets executive dashboard.
      { source: "/portfolio", destination: "/architecture/executive-dashboard", permanent: true },
      // Executive reviews retired — operator /reviews tree is canonical (TB-608 follow-on).
      { source: "/executive/reviews", destination: "/reviews", permanent: true },
      { source: "/executive/reviews/:path*", destination: "/reviews/:path*", permanent: true },
      // Per-cloud help topics — slash aliases are canonical (retired hyphen slug URLs).
      { source: "/help/cloud-connections-azure", destination: "/help/cloud-connections/azure", permanent: true },
      { source: "/help/cloud-connections-aws", destination: "/help/cloud-connections/aws", permanent: true },
      { source: "/help/cloud-connections-gcp", destination: "/help/cloud-connections/gcp", permanent: true },
      // Marketing first-run consolidation (TB-736) — single public CTA at /get-started.
      { source: "/quick-start", destination: "/get-started", permanent: true },
      { source: "/quick-start/:path*", destination: "/get-started", permanent: true },
      // Internal Operations — recommendation learning canonical route (temporary during migration).
      {
        source: "/recommendation-learning",
        destination: "/internal-operations/recommendation-learning",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      // Friendly demo URL while reusing signed-record detail implementation (`SHOWCASE_STATIC_DEMO_*`).
      // Must precede the generic run-scoped signed-record rewrite below.
      {
        source: "/reviews/claims-intake-modernization/signed-record",
        destination: "/signed-records/a1c2e3f4-a5b6-7890-abcd-ef1234567890",
      },
      // Run-scoped signed record deep link lands on the review package (manifest summary section).
      { source: "/reviews/:id/signed-record", destination: "/reviews/:id" },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

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

/**
 * `next-font-manifest.json` is emitted by the client webpack compiler but consumed while collecting page data.
 * Default separate webpack compiler workers have intermittently finished the worker subprocess before all emitted
 * assets are visible on disk on Windows, yielding MODULE_NOT_FOUND for `.next/server/next-font-manifest.json`.
 * Building compilers in-process avoids that race; Linux CI keeps default worker behavior for throughput.
 *
 * Override: `ARCHLUCID_NEXT_WEBPACK_BUILD_WORKER=1` or `true` re-enables workers on Windows when investigating perf.
 */
const forceWebpackBuildWorker =
  process.env.ARCHLUCID_NEXT_WEBPACK_BUILD_WORKER === "1" ||
  process.env.ARCHLUCID_NEXT_WEBPACK_BUILD_WORKER === "true";

const disableWebpackBuildWorkerOnWindows =
  process.platform === "win32" && !forceWebpackBuildWorker;

const nextConfig: NextConfig = {
  env: {
    /** Mirrors Vite-style naming — exposed to client/server bundles for opt-in API mocks (see `sandbox-api-mocks`). */
    VITE_USE_SANDBOX_MOCKS: process.env.VITE_USE_SANDBOX_MOCKS ?? "",
  },
  /** Production/Docker `next build` must not typecheck Vitest-only roots (`testing/`, `vitest.*.ts`). IDE keeps `tsconfig.json`. */
  typescript: {
    tsconfigPath: "tsconfig.build.json",
  },
  reactStrictMode: true,
  // Standalone output copies only required node_modules into .next/standalone,
  // producing a self-contained deployment unit suitable for Docker / App Service.
  //
  // On some Windows setups, traced standalone copy hits ENOENT for
  // `page_client-reference-manifest.js` during `Collecting build traces` (upstream Next + NFT).
  // Docker/Linux builds are unaffected; set ARCHLUCID_SKIP_STANDALONE_OUTPUT=1 locally to finish `npm run build`.
  ...(skipStandaloneOutput ? {} : { output: "standalone" as const }),
  ...(disableWebpackBuildWorkerOnWindows ? { experimental: { webpackBuildWorker: false } } : {}),
  transpilePackages: ["reactflow"],
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [immutableStaticAssetCacheControl],
      },
      {
        source: "/images/:path*",
        headers: [immutableStaticAssetCacheControl],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
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
      { source: "/alert-rules", destination: "/alerts?tab=rules", permanent: false },
      { source: "/alert-routing", destination: "/alerts?tab=routing", permanent: false },
      { source: "/composite-alert-rules", destination: "/alerts?tab=composite", permanent: false },
      { source: "/alert-simulation", destination: "/alerts?tab=simulation", permanent: false },
      { source: "/alert-tuning", destination: "/alerts?tab=simulation", permanent: false },
      { source: "/settings/webhooks", destination: "/integrations/webhooks", permanent: false },
      { source: "/integrations/itsm", destination: "/integrations/operations", permanent: false },
      { source: "/admin/ai-usage-cost", destination: "/settings/cost-reporting", permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Canonical signed-records aliases reuse existing manifests App Router tree (TB-399).
      { source: "/signed-records", destination: "/manifests" },
      { source: "/signed-records/:path*", destination: "/manifests/:path*" },
      // Run-scoped signed record deep link lands on the review package (manifest summary section).
      { source: "/reviews/:id/signed-record", destination: "/reviews/:id" },
      // Friendly demo URL while reusing manifest detail implementation (`SHOWCASE_STATIC_DEMO_*`).
      {
        source: "/reviews/claims-intake-modernization/signed-record",
        destination: "/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890",
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

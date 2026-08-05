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
      // Force-canonical public URL namespace — paired with rewrites to on-disk /reviews pages.
      // Specific /reviews/* aliases must precede the /reviews/:path* catch-all.
      { source: "/reviews/:id/manifest", destination: "/architecture/reviews/:id/signed-record", permanent: true },
      {
        source: "/reviews/claims-intake-modernization/architecture",
        destination: "/architecture/reviews/claims-intake-modernization/signed-record",
        permanent: true,
      },
      { source: "/reviews", destination: "/architecture/reviews", permanent: true },
      { source: "/reviews/:path*", destination: "/architecture/reviews/:path*", permanent: true },
      {
        source: "/architecture/reviews/:id/manifest",
        destination: "/architecture/reviews/:id/signed-record",
        permanent: true,
      },
      {
        source: "/architecture/reviews/claims-intake-modernization/architecture",
        destination: "/architecture/reviews/claims-intake-modernization/signed-record",
        permanent: true,
      },
      { source: "/architectures", destination: "/architecture/architectures", permanent: true },
      { source: "/architectures/:path*", destination: "/architecture/architectures/:path*", permanent: true },
      { source: "/signed-records", destination: "/governance/signed-records", permanent: true },
      { source: "/signed-records/:path*", destination: "/governance/signed-records/:path*", permanent: true },
      { source: "/manifests", destination: "/governance/signed-records", permanent: true },
      { source: "/manifests/:path*", destination: "/governance/signed-records/:path*", permanent: true },
      { source: "/digests", destination: "/architecture/digests", permanent: true },
      {
        source: "/digest-subscriptions",
        destination: "/architecture/digests?tab=subscriptions",
        permanent: true,
      },
      { source: "/administration", destination: "/administration", permanent: true },
      { source: "/administration/:path*", destination: "/administration/:path*", permanent: true },
      { source: "/workspace/security-trust", destination: "/administration/security-trust", permanent: true },
      { source: "/admin/users", destination: "/administration/users", permanent: true },
      { source: "/admin/support", destination: "/administration/support", permanent: true },
      {
        source: "/settings/roles",
        destination: "/administration/users?tab=roles",
        permanent: true,
      },
      {
        source: "/governance/risk-exceptions",
        destination: "/governance/exceptions",
        permanent: true,
      },
      {
        source: "/governance/risk-exceptions/:path*",
        destination: "/governance/exceptions/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Friendly demo URL while reusing signed-record detail implementation (`SHOWCASE_STATIC_DEMO_*`).
      // Must precede the generic run-scoped signed-record rewrite below.
      {
        source: "/architecture/reviews/claims-intake-modernization/signed-record",
        destination: "/governance/signed-records/a1c2e3f4-a5b6-7890-abcd-ef1234567890",
      },
      // Run-scoped signed record deep link lands on the review package (manifest summary section).
      { source: "/architecture/reviews/:id/signed-record", destination: "/reviews/:id" },
      // Public /architecture/reviews/* URLs map to on-disk app/(operator)/reviews pages.
      { source: "/architecture/reviews", destination: "/reviews" },
      { source: "/architecture/reviews/:path*", destination: "/reviews/:path*" },
      // Public /architecture/architectures/* URLs map to on-disk app/(operator)/architectures pages.
      { source: "/architecture/architectures", destination: "/architectures" },
      { source: "/architecture/architectures/:path*", destination: "/architectures/:path*" },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

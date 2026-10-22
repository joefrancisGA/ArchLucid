/**
 * Remote / chosen-site Lighthouse CI (GTM M-99).
 * Lab mock budgets remain in lighthouserc.cjs — do not replace that pipeline.
 */
const fs = require("node:fs");
const path = require("node:path");

const routesManifestPath = path.join(__dirname, "performance", "lighthouse-acceptance-routes.v1.json");
const routesManifest = JSON.parse(fs.readFileSync(routesManifestPath, "utf8"));

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

function resolveAcceptanceBaseUrl() {
  const acceptance = process.env.ACCEPTANCE_BASE_URL?.trim();

  if (acceptance) {
    return stripTrailingSlash(acceptance);
  }

  const staging = process.env.STAGING_BASE_URL?.trim();

  if (staging) {
    return stripTrailingSlash(staging);
  }

  return "http://127.0.0.1:3000";
}

const baseUrl = resolveAcceptanceBaseUrl();
const hasStorageState = Boolean(process.env.ACCEPTANCE_STORAGE_STATE?.trim());
const includeAuth =
  hasStorageState ||
  process.env.FOUNDER_INCLUDE_AUTH_ROUTES === "1" ||
  process.env.LIGHTHOUSE_ACCEPTANCE_INCLUDE_AUTH === "1";

const routes = [
  ...routesManifest.publicRoutes,
  ...(includeAuth ? routesManifest.authenticatedRoutes : []),
];

const isRemoteHttps = baseUrl.startsWith("https://");
const numberOfRuns = Number.parseInt(process.env.LIGHTHOUSE_ACCEPTANCE_RUNS ?? "3", 10) || 3;

/**
 * Category scores warn-only (lab posture). Hard fails limited to material defects:
 * severe CLS, huge payload, HTTPS on remote hosts. Axe founder suite (M-105) owns AA.
 */
const assertions = {
  "categories:performance": ["warn", { minScore: 0.35 }],
  "categories:accessibility":
    process.env.FOUNDER_LH_HARD_A11Y === "1"
      ? ["error", { minScore: 0.4 }]
      : ["warn", { minScore: 0.85 }],
  "categories:best-practices": ["warn", { minScore: 0.75 }],
  "categories:seo": ["warn", { minScore: 0.8 }],
  "first-contentful-paint": ["warn", { maxNumericValue: 4000 }],
  "largest-contentful-paint": ["warn", { maxNumericValue: 6000 }],
  "total-blocking-time": ["warn", { maxNumericValue: 600 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.25 }],
  "total-byte-weight": ["error", { maxNumericValue: 5_500_000 }],
};

if (isRemoteHttps) {
  assertions["is-on-https"] = ["error"];
}

/** @type {{ ci: Record<string, unknown> }} */
const config = {
  ci: {
    collect: {
      url: routes.map((route) => `${baseUrl}${route}`),
      numberOfRuns,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions,
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci-acceptance",
    },
  },
};

if (hasStorageState) {
  config.ci.collect.puppeteerScript = path.join(
    __dirname,
    "scripts",
    "lighthouse-acceptance-puppeteer.cjs",
  );
}

module.exports = config;

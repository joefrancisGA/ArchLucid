const fs = require("node:fs");
const path = require("node:path");

const routesManifestPath = path.join(__dirname, "performance", "lighthouse-ci-routes.v1.json");
const routesManifest = JSON.parse(fs.readFileSync(routesManifestPath, "utf8"));

const port = process.env.MOCK_E2E_PORT ?? process.env.PORT ?? "3000";
const baseUrl = `http://127.0.0.1:${port}`;

module.exports = {
  ci: {
    collect: {
      url: routesManifest.routes.map((route) => `${baseUrl}${route}`),
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.35 }],
        "categories:accessibility": ["warn", { minScore: 0.85 }],
        "categories:best-practices": ["warn", { minScore: 0.75 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 6000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.15 }],
        "total-blocking-time": ["warn", { maxNumericValue: 600 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};

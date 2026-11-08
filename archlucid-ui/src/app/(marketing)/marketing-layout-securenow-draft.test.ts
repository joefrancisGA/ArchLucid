import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const marketingAppDir = dirname(fileURLToPath(import.meta.url));
const marketingLayoutSource = readFileSync(join(marketingAppDir, "layout.tsx"), "utf8");
const resourcesMenuSource = readFileSync(
  join(marketingAppDir, "..", "..", "components", "marketing", "MarketingResourcesMenu.tsx"),
  "utf8",
);
const welcomeMarketingEngagementPathsSource = readFileSync(
  join(marketingAppDir, "..", "..", "components", "marketing", "WelcomeMarketingEngagementPathsSection.tsx"),
  "utf8",
);
const welcomeMarketingProofAtGlanceSource = readFileSync(
  join(marketingAppDir, "..", "..", "components", "marketing", "WelcomeMarketingProofAtGlanceSection.tsx"),
  "utf8",
);
const welcomeMarketingPageSource = readFileSync(
  join(marketingAppDir, "..", "..", "components", "marketing", "WelcomeMarketingPage.tsx"),
  "utf8",
);
const marketingPublicFooterSource = readFileSync(
  join(marketingAppDir, "..", "..", "components", "marketing", "MarketingPublicFooter.tsx"),
  "utf8",
);
const securenowSampleCopySource = readFileSync(
  join(marketingAppDir, "..", "..", "lib", "marketing", "securenow-sample-copy.ts"),
  "utf8",
);

describe("marketing layout SecureNow draft (SN-MKT-04)", () => {
  it("uses shouldRedirectMarketingLayout and the security-shell test id", () => {
    expect(marketingLayoutSource).toContain("shouldRedirectMarketingLayout");
    expect(marketingLayoutSource).toContain("why-securenow-security-shell");
    expect(marketingLayoutSource).toContain("ARCHLUCID_PATHNAME_REQUEST_HEADER");
  });

  it("matches the shipped resources links without adding why-securenow to welcome or footer", () => {
    expect(resourcesMenuSource).toContain('href="/why-securenow"');
    expect(resourcesMenuSource).toContain('href="/securenow-sample"');

    expect(welcomeMarketingEngagementPathsSource).not.toContain('href="/why-securenow"');
    expect(welcomeMarketingEngagementPathsSource).not.toContain('href="/securenow-sample"');
    expect(welcomeMarketingProofAtGlanceSource).not.toContain('href="/why-securenow"');
    expect(welcomeMarketingProofAtGlanceSource).not.toContain('href="/securenow-sample"');

    expect(marketingPublicFooterSource).toContain("PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF");
    expect(marketingPublicFooterSource).not.toContain('href="/why-securenow"');
    expect(welcomeMarketingPageSource).toContain("PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF");
    expect(welcomeMarketingPageSource).not.toContain('href="/why-securenow"');
    expect(welcomeMarketingPageSource).toContain("SECURENOW_SAMPLE_FIXTURE_LINE");
    expect(securenowSampleCopySource).toContain("Synthetic fixture. Not a customer result.");
  });
});

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
const marketingPublicFooterSource = readFileSync(
  join(marketingAppDir, "..", "..", "components", "marketing", "MarketingPublicFooter.tsx"),
  "utf8",
);

describe("marketing layout SecureNow draft (SN-MKT-04)", () => {
  it("uses shouldRedirectMarketingLayout and the security-shell test id", () => {
    expect(marketingLayoutSource).toContain("shouldRedirectMarketingLayout");
    expect(marketingLayoutSource).toContain("why-securenow-security-shell");
    expect(marketingLayoutSource).toContain("ARCHLUCID_PATHNAME_REQUEST_HEADER");
  });

  it("matches the shipped resources links without adding public-surface links", () => {
    expect(resourcesMenuSource).toContain('href="/why-securenow"');
    expect(resourcesMenuSource).toContain('href="/securenow-sample"');

    for (const source of [
      welcomeMarketingEngagementPathsSource,
      welcomeMarketingProofAtGlanceSource,
      marketingPublicFooterSource,
    ]) {
      expect(source).not.toContain('href="/why-securenow"');
      expect(source).not.toContain('href="/securenow-sample"');
    }
  });
});

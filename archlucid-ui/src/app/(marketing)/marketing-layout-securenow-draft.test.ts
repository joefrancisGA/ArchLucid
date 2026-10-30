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

describe("marketing layout SecureNow draft (SN-MKT-04)", () => {
  it("uses shouldRedirectMarketingLayout and the security-shell test id", () => {
    expect(marketingLayoutSource).toContain("shouldRedirectMarketingLayout");
    expect(marketingLayoutSource).toContain("why-securenow-security-shell");
    expect(marketingLayoutSource).toContain("ARCHLUCID_PATHNAME_REQUEST_HEADER");
  });

  it("does not link the draft from marketing resources", () => {
    expect(resourcesMenuSource).not.toContain('href="/why-securenow"');
  });
});

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_DIGEST_SUBSCRIPTIONS_PATH,
  RETIRED_DIGEST_SUBSCRIPTIONS_PATH,
} from "@/lib/digest-subscriptions-legacy-route";
import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";
import { MARKETING_ROBOTS_DISALLOW_PREFIXES, MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";
import { operatorRouteReadiness } from "@/lib/route-readiness";

import nextConfig from "../../next.config";

const RETIRED_DIGEST_SUBSCRIPTIONS_APP_DIR = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "digest-subscriptions",
);

const PRODUCT_DIGEST_SUBSCRIPTIONS_SURFACES = [
  "archlucid-ui/src/lib/pilot-nav-group-builder.ts",
  "archlucid-ui/src/lib/command-palette-curated-tasks.ts",
  "archlucid-ui/src/lib/digests-schedule-evidence-copy.ts",
  "archlucid-ui/src/lib/nav-shell-visibility.ts",
] as const;

describe("digest-subscriptions retired route (IXX / TB-1495)", () => {
  it("keeps canonical subscriptions on Digests hub tab", () => {
    expect(CANONICAL_DIGEST_SUBSCRIPTIONS_PATH).toBe(DIGESTS_SUBSCRIPTIONS_TAB_PATH);
    expect(CANONICAL_DIGEST_SUBSCRIPTIONS_PATH).toBe("/architecture/digests?tab=subscriptions");
  });

  it("does not ship a next.config redirect for /digest-subscriptions", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((entry) => entry.source === RETIRED_DIGEST_SUBSCRIPTIONS_PATH)).toBeUndefined();
  });

  it("does not list /digest-subscriptions among permanent redirect sources", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(RETIRED_DIGEST_SUBSCRIPTIONS_PATH);
    expect(hrefTargetsPermanentRedirectSource(RETIRED_DIGEST_SUBSCRIPTIONS_PATH)).toBe(false);
  });

  it("does not ship an App Router page or layout under digest-subscriptions", () => {
    expect(existsSync(join(RETIRED_DIGEST_SUBSCRIPTIONS_APP_DIR, "page.tsx"))).toBe(false);
    expect(existsSync(join(RETIRED_DIGEST_SUBSCRIPTIONS_APP_DIR, "layout.tsx"))).toBe(false);
  });

  it("resolves legacy bookmark readiness via canonical Digests hub", () => {
    expect(operatorRouteReadiness(RETIRED_DIGEST_SUBSCRIPTIONS_PATH)).toBe("advanced-only");
  });

  it("does not promote the retired path in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(RETIRED_DIGEST_SUBSCRIPTIONS_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${RETIRED_DIGEST_SUBSCRIPTIONS_PATH}/`);
  });

  it("keeps product handoffs on canonical Digests hub paths", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_DIGEST_SUBSCRIPTIONS_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(source).not.toContain(`href="${RETIRED_DIGEST_SUBSCRIPTIONS_PATH}"`);
      expect(source).not.toContain(`"${RETIRED_DIGEST_SUBSCRIPTIONS_PATH}" as const`);
    }
  });

  it("does not list ghost trailing-slash SEO prefix for digest-subscriptions (TB-1496 hygiene)", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(`${RETIRED_DIGEST_SUBSCRIPTIONS_PATH}/`);
  });
});

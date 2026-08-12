import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AI_USAGE_LEGACY_ADMIN_PATH,
  AI_USAGE_SETTINGS_PATH,
} from "@/lib/ai-usage-nav-paths";
import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";
import { MARKETING_ROBOTS_DISALLOW_PREFIXES, MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";
import { operatorRouteReadiness } from "@/lib/route-readiness";

import nextConfig from "../../next.config";

const RETIRED_AI_USAGE_ADMIN_APP_DIR = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "admin",
  "ai-usage-cost",
);

const PRODUCT_AI_USAGE_SURFACES = [
  "archlucid-ui/src/lib/nav-shell-visibility.ts",
  "archlucid-ui/src/lib/operator/operator-admin-nav-group-builder.ts",
] as const;

describe("ai-usage legacy admin route (AAX / TB-1404–TB-1407)", () => {
  it("keeps canonical AI usage settings on /administration/ai-usage", () => {
    expect(AI_USAGE_SETTINGS_PATH).toBe("/administration/ai-usage");
    expect(AI_USAGE_LEGACY_ADMIN_PATH).toBe("/admin/ai-usage-cost");
  });

  it("does not ship a next.config redirect for /admin/ai-usage-cost", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((entry) => entry.source === AI_USAGE_LEGACY_ADMIN_PATH)).toBeUndefined();
  });

  it("does not list /admin/ai-usage-cost among permanent redirect sources", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(AI_USAGE_LEGACY_ADMIN_PATH);
    expect(hrefTargetsPermanentRedirectSource(AI_USAGE_LEGACY_ADMIN_PATH)).toBe(false);
  });

  it("does not ship an App Router page or layout under admin/ai-usage-cost", () => {
    expect(existsSync(join(RETIRED_AI_USAGE_ADMIN_APP_DIR, "page.tsx"))).toBe(false);
    expect(existsSync(join(RETIRED_AI_USAGE_ADMIN_APP_DIR, "layout.tsx"))).toBe(false);
  });

  it("resolves legacy bookmark readiness via canonical AI usage settings", () => {
    expect(canonicalizeLegacyOperatorRoutePath(AI_USAGE_LEGACY_ADMIN_PATH)).toBe(AI_USAGE_SETTINGS_PATH);
    expect(operatorRouteReadiness(AI_USAGE_LEGACY_ADMIN_PATH)).toBe("admin-only");
  });

  it("does not promote the retired path in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(AI_USAGE_LEGACY_ADMIN_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${AI_USAGE_LEGACY_ADMIN_PATH}/`);
  });

  it("keeps product handoffs on canonical AI usage settings paths", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_AI_USAGE_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(source).not.toContain(`href="${AI_USAGE_LEGACY_ADMIN_PATH}"`);
      expect(source).not.toContain(`"${AI_USAGE_LEGACY_ADMIN_PATH}" as const`);
    }
  });

  it("does not list ghost trailing-slash SEO prefix for admin/ai-usage-cost (TB-1407 hygiene)", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(`${AI_USAGE_LEGACY_ADMIN_PATH}/`);
  });
});

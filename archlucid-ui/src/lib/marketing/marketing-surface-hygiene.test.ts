import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findMarketingSurfaceHygieneViolations,
  MARKETING_SURFACE_BANNED_LINK_TARGET_PATTERNS,
} from "./marketing-surface-hygiene";
import { MARKETING_SITEMAP_PATHNAMES } from "./public-marketing-seo-paths";

const REPO_ROOT = resolve(__dirname, "../../../..");
const QUICK_START_APP_PAGE = join(REPO_ROOT, "archlucid-ui/src/app/(marketing)/quick-start/page.tsx");
const QUICK_START_CLIENT = join(REPO_ROOT, "archlucid-ui/src/app/(marketing)/quick-start/QuickStartClient.tsx");

describe("marketing-surface-hygiene (TB-736)", () => {
  it("has no internal-link, backlog-label, or Operator-voice leaks in marketing surfaces", () => {
    const violations = findMarketingSurfaceHygieneViolations(REPO_ROOT);

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  it("does not list retired /quick-start in the marketing sitemap", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain("/quick-start");
    expect(MARKETING_SITEMAP_PATHNAMES).toContain("/get-started");
  });

  it("does not ship /quick-start redirect or competing marketing UI", () => {
    const nextConfigText = readFileSync(join(REPO_ROOT, "archlucid-ui/next.config.ts"), "utf8");

    expect(nextConfigText).not.toContain('source: "/quick-start"');
    expect(existsSync(QUICK_START_APP_PAGE)).toBe(false);
    expect(existsSync(QUICK_START_CLIENT)).toBe(false);
  });

  it("documents banned internal marketing link patterns for regression clarity", () => {
    expect(MARKETING_SURFACE_BANNED_LINK_TARGET_PATTERNS.map((pattern) => pattern.source)).toEqual([
      "\\/why-archlucid(?!-)",
      "\\/demo\\/explain",
    ]);
  });
});

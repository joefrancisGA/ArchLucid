import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";
import { RETIRED_ONBOARDING_START_BOOKMARK_PATH } from "@/lib/ui-route-traffic-retired-redirect-shims";

const LEGACY_ONBOARDING_START_APP_DIRS = [
  join(process.cwd(), "src", "app", "onboarding", "start"),
  join(process.cwd(), "src", "app", "(marketing)", "onboarding", "start"),
  join(process.cwd(), "src", "app", "(operator)", "onboarding", "start"),
] as const;

const ONBOARDING_START_CLIENT_UI_PATTERNS = [
  /OnboardingPageView/,
  /OnboardingWizard/,
  /FinishSetupWizardPanel/,
  /"use client"/,
] as const;

function collectRouteModuleSources(rootDir: string): string[] {
  if (!existsSync(rootDir)) {
    return [];
  }

  const sources: string[] = [];

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      sources.push(...collectRouteModuleSources(entryPath));
      continue;
    }

    if (entry.isFile() && /\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      sources.push(readFileSync(entryPath, "utf8"));
    }
  }

  return sources;
}

describe("legacy onboarding-start bookmark (ONS / TB-1805)", () => {
  it("documents retired /onboarding/start and canonical first-review-guide", () => {
    expect(RETIRED_ONBOARDING_START_BOOKMARK_PATH).toBe("/onboarding/start");
    expect(FIRST_REVIEW_GUIDE_PATH).toBe("/architecture/first-review-guide");
    expect(buildOnboardingRedirectPath({ source: "registration" })).toBe(
      "/architecture/first-review-guide?source=registration",
    );
  });

  it("does not ship an App Router page under onboarding/start (TB-1805 anti-reintro)", () => {
    for (const appDir of LEGACY_ONBOARDING_START_APP_DIRS) {
      expect(existsSync(join(appDir, "page.tsx"))).toBe(false);
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
    }
  });

  it("does not mount client onboarding UI under onboarding/start route modules", () => {
    for (const appDir of LEGACY_ONBOARDING_START_APP_DIRS) {
      for (const source of collectRouteModuleSources(appDir)) {
        for (const pattern of ONBOARDING_START_CLIENT_UI_PATTERNS) {
          expect(source, `unexpected onboarding UI in ${appDir}`).not.toMatch(pattern);
        }
      }
    }
  });
});

import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";
import { RETIRED_ONBOARD_BOOKMARK_PATH } from "@/lib/ui-route-traffic-retired-redirect-shims";

const LEGACY_ONBOARD_APP_DIRS = [
  join(process.cwd(), "src", "app", "onboard"),
  join(process.cwd(), "src", "app", "(marketing)", "onboard"),
  join(process.cwd(), "src", "app", "(operator)", "onboard"),
] as const;

describe("legacy onboard bookmark (ON / TB-1796)", () => {
  it("documents retired /onboard and canonical first-review-guide", () => {
    expect(RETIRED_ONBOARD_BOOKMARK_PATH).toBe("/onboard");
    expect(FIRST_REVIEW_GUIDE_PATH).toBe("/architecture/first-review-guide");
    expect(buildOnboardingRedirectPath({ source: "email" })).toBe(
      "/architecture/first-review-guide?source=email",
    );
  });

  it("preserves multi-value query keys for a future /onboard shim", () => {
    const path = buildOnboardingRedirectPath({ handoff: ["trial", "email"] });

    expect(path).toContain(`${FIRST_REVIEW_GUIDE_PATH}?`);
    expect(path).toContain("handoff=trial");
    expect(path).toContain("handoff=email");
  });

  it("does not ship an App Router page under onboard", () => {
    for (const appDir of LEGACY_ONBOARD_APP_DIRS) {
      expect(existsSync(join(appDir, "page.tsx"))).toBe(false);
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
    }
  });
});

import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { buildLoginRedirectPath } from "@/lib/legacy-login-redirect";
import {
  AUTH_SESSION_EXPIRED_PATH,
  CANONICAL_AUTH_SIGNIN_PATH,
  LEGACY_LOGIN_PATH,
} from "@/lib/legacy-login-route";
import { MARKETING_ROBOTS_DISALLOW_PREFIXES, MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";

const LEGACY_LOGIN_APP_DIRS = [
  join(process.cwd(), "src", "app", "login"),
  join(process.cwd(), "src", "app", "(marketing)", "login"),
  join(process.cwd(), "src", "app", "(operator)", "login"),
] as const;

describe("legacy login route (LOX / TB-1791 / TB-1794)", () => {
  it("keeps canonical sign-in on /auth/signin with idle-timeout → session-expired", () => {
    expect(LEGACY_LOGIN_PATH).toBe("/login");
    expect(CANONICAL_AUTH_SIGNIN_PATH).toBe("/auth/signin");
    expect(AUTH_SESSION_EXPIRED_PATH).toBe("/auth/session-expired");
    expect(buildLoginRedirectPath({ returnUrl: "/architecture/reviews" })).toBe(
      "/auth/signin?returnUrl=%2Farchitecture%2Freviews",
    );
    expect(buildLoginRedirectPath({ reason: "idle-timeout" })).toBe(
      "/auth/session-expired?reason=idle-timeout",
    );
  });

  it("does not ship an App Router page under login", () => {
    for (const appDir of LEGACY_LOGIN_APP_DIRS) {
      expect(existsSync(join(appDir, "page.tsx"))).toBe(false);
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
    }
  });

  it("resolves legacy bookmark readiness via canonical auth sign-in", () => {
    expect(canonicalizeLegacyOperatorRoutePath(LEGACY_LOGIN_PATH)).toBe(CANONICAL_AUTH_SIGNIN_PATH);
  });

  it("does not promote the retired path in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_LOGIN_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_LOGIN_PATH}/`);
  });

  it("keeps /login in robots disallow prefixes (TB-1793)", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_LOGIN_PATH);
  });
});

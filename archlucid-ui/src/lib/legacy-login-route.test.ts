import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AUTH_SIGNIN_PATH } from "@/lib/auth-operator-route-paths";
import { buildLoginRedirectPath } from "@/lib/legacy-login-redirect";
import {
  CANONICAL_AUTH_SIGNIN_TRAFFIC_PATH,
  RETIRED_LOGIN_BOOKMARK_PATH,
} from "@/lib/ui-route-traffic-retired-redirect-shims";

const LEGACY_LOGIN_APP_DIRS = [
  join(process.cwd(), "src", "app", "login"),
  join(process.cwd(), "src", "app", "(marketing)", "login"),
  join(process.cwd(), "src", "app", "(operator)", "login"),
] as const;

describe("legacy login bookmark (LOX / TB-1791)", () => {
  it("documents retired /login and canonical sign-in paths", () => {
    expect(RETIRED_LOGIN_BOOKMARK_PATH).toBe("/login");
    expect(AUTH_SIGNIN_PATH).toBe("/auth/signin");
    expect(CANONICAL_AUTH_SIGNIN_TRAFFIC_PATH).toBe("/auth/signin");
  });

  it("locks redirect matrix for a future /login shim (signin + idle-timeout)", () => {
    expect(buildLoginRedirectPath({ returnUrl: "/architecture/reviews" })).toBe(
      "/auth/signin?returnUrl=%2Farchitecture%2Freviews",
    );
    expect(buildLoginRedirectPath({ reason: "idle-timeout" })).toBe(
      "/auth/session-expired?reason=idle-timeout",
    );
  });

  it("does not ship an App Router page under login (TB-1791 anti-reintro)", () => {
    for (const appDir of LEGACY_LOGIN_APP_DIRS) {
      expect(existsSync(join(appDir, "page.tsx"))).toBe(false);
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
    }
  });
});

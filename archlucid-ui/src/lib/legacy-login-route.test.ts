import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LEGACY_LOGIN_ROUTE_METADATA } from "@/lib/legacy-login-route-metadata";
import { LEGACY_LOGIN_PATH } from "@/lib/legacy-login-route";

const LOGIN_APP_PAGE = join(process.cwd(), "src", "app", "login", "page.tsx");
const LOGIN_APP_LAYOUT = join(process.cwd(), "src", "app", "login", "layout.tsx");

const PRODUCT_SIGN_IN_SURFACES = [
  "archlucid-ui/src/hooks/useOperatorShellAccessRedirects.ts",
  "archlucid-ui/src/app/(marketing)/showcase/[runId]/ShowcaseQuickNav.tsx",
  "archlucid-ui/src/app/(executive)/executive/scorecard/ExecutiveScorecardClient.tsx",
] as const;

describe("legacy-login-route (TB-1793 / TB-1794)", () => {
  it("marks the legacy shim as noindex with honest metadata", () => {
    expect(LEGACY_LOGIN_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(LEGACY_LOGIN_ROUTE_METADATA.title).toContain("Redirect");
    expect(LEGACY_LOGIN_ROUTE_METADATA.description?.toLowerCase()).toContain("legacy");
  });

  it("ships redirect-only App Router page and layout metadata", () => {
    const pageSource = readFileSync(LOGIN_APP_PAGE, "utf8");
    const layoutSource = readFileSync(LOGIN_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("redirect(");
    expect(pageSource).toContain("buildLoginRedirectPath");
    expect(pageSource).toContain("buildSessionExpiredHref");
    expect(layoutSource).toContain("LEGACY_LOGIN_ROUTE_METADATA");
  });

  it("keeps product sign-in CTAs on canonical /auth/signin (TB-1794)", () => {
    const repoRoot = join(process.cwd(), "..");
    const bannedHubHref = `"${LEGACY_LOGIN_PATH}"`;

    for (const relativePath of PRODUCT_SIGN_IN_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).not.toContain(bannedHubHref);
      expect(source).not.toContain(`href="${LEGACY_LOGIN_PATH}"`);
      expect(source).toContain("buildAuthSignInHref");
    }
  });
});

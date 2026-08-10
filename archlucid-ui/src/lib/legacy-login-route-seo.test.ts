import { describe, expect, it } from "vitest";

import { LEGACY_LOGIN_PATH } from "@/lib/legacy-login-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

describe("legacy-login-route SEO inventory (TB-1793)", () => {
  it("does not promote /login in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_LOGIN_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_LOGIN_PATH}/`);
  });

  it("keeps /login in robots disallow prefixes while the redirect shim may exist", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_LOGIN_PATH);
  });
});

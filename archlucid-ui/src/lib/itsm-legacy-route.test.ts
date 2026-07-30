import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildItsmAtlassianOAuthRedirectUri } from "@/lib/api/itsm-outbound-api";
import {
  INTEGRATIONS_READINESS_PATH,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH,
  LEGACY_INTEGRATIONS_ITSM_PATH,
} from "@/lib/integrations-nav-paths";
import { hrefTargetsPermanentRedirectSource } from "@/lib/next-config-permanent-redirect-source-paths";

import nextConfig from "../../next.config";

const ITSM_OAUTH_CALLBACK_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "integrations",
  "itsm",
  "oauth",
  "callback",
  "page.tsx",
);

describe("ITSM legacy route (TB-1776)", () => {
  it("redirects hub /integrations/itsm to Integration readiness only", async () => {
    const redirectRules = await nextConfig.redirects?.();
    const hubRule = redirectRules?.find((entry) => entry.source === LEGACY_INTEGRATIONS_ITSM_PATH);
    const wildcardRule = redirectRules?.find(
      (entry) => entry.source === `${LEGACY_INTEGRATIONS_ITSM_PATH}/:path*`,
    );

    expect(hubRule?.destination).toBe(INTEGRATIONS_READINESS_PATH);
    expect(hubRule?.permanent).toBe(true);
    expect(wildcardRule).toBeUndefined();
  });

  it("does not treat the Atlassian OAuth callback as a permanent redirect hop", () => {
    expect(hrefTargetsPermanentRedirectSource(LEGACY_INTEGRATIONS_ITSM_PATH)).toBe(true);
    expect(hrefTargetsPermanentRedirectSource(ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH)).toBe(false);
  });

  it("keeps buildItsmAtlassianOAuthRedirectUri on the callback page path", () => {
    const redirectUri = buildItsmAtlassianOAuthRedirectUri();
    const pathname = redirectUri.startsWith("/")
      ? redirectUri
      : new URL(redirectUri).pathname;

    expect(pathname).toBe(ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH);
  });

  it("ships the OAuth callback App Router page", () => {
    expect(existsSync(ITSM_OAUTH_CALLBACK_APP_PAGE)).toBe(true);
  });
});

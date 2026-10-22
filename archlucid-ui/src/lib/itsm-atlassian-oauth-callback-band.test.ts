import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-error-copy";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_TITLE,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const ITSM_OAUTH_CALLBACK_BAND_TEST_FILES = [
  "src/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient.test.tsx",
  "src/lib/itsm/itsm-atlassian-oauth-callback-error-copy.test.ts",
] as const;

describe("itsm atlassian oauth callback band regression (TB-1785)", () => {
  it("keeps sibling Vitest guards for TB-1781 through TB-1784 on disk", () => {
    for (const relativePath of ITSM_OAUTH_CALLBACK_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("documents success, denial, incomplete, and refresh-token failure copy (TB-1784)", () => {
    expect(ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_TITLE.length).toBeGreaterThan(0);
    expect(ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL.length).toBeGreaterThan(0);
    expect(ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED.length).toBeGreaterThan(0);
    expect(ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE.length).toBeGreaterThan(0);
    expect(ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED.length).toBeGreaterThan(0);
    expect(INTEGRATIONS_JIRA_PATH).toBe("/integrations/jira");
  });

  it("tracks OAuth callback on IIO traffic row (TB-1781)", () => {
    const iio = findUiRouteTrafficRow("IIO");

    expect(iio).toBeDefined();
    expect(iio?.path).toBe("/integrations/itsm/oauth/callback");
    expect(iio?.section).toBe("Integrations");
    expect(iio?.note?.toLowerCase()).toContain("oauth");
  });
});

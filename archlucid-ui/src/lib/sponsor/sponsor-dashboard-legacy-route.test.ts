import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";
import {
  LEGACY_SPONSOR_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH,
  LEGACY_PORTFOLIO_OVERVIEW_PATH,
} from "@/lib/ui-route-traffic-architecture-sponsor-dashboard";

import nextConfig from "../../../next.config";

const RETIRED_SPONSOR_DASHBOARD_APP_DIRS = [
  join(process.cwd(), "src", "app", "(sponsor)", "sponsor", "dashboard"),
  join(process.cwd(), "src", "app", "(operator)", "sponsor", "dashboard"),
  join(process.cwd(), "src", "app", "(operator)", "dashboard"),
] as const;

const RETIRED_SPONSOR_DASHBOARD_PATHS = [
  LEGACY_SPONSOR_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH,
  LEGACY_PORTFOLIO_OVERVIEW_PATH,
] as const;

describe("sponsor-dashboard retired bookmarks (EDA / TB-1525)", () => {
  it("keeps canonical sponsor dashboard on /architecture/sponsor-dashboard", () => {
    expect(SPONSOR_DASHBOARD_HREF).toBe("/architecture/sponsor-dashboard");
  });

  it.each(RETIRED_SPONSOR_DASHBOARD_PATHS)(
    "does not ship a next.config redirect for %s",
    async (legacyPath) => {
      const redirectRules = await nextConfig.redirects?.();

      expect(redirectRules?.find((entry) => entry.source === legacyPath)).toBeUndefined();
      expect(redirectRules?.find((entry) => entry.source === `${legacyPath}/:path*`)).toBeUndefined();
    },
  );

  it.each(RETIRED_SPONSOR_DASHBOARD_PATHS)(
    "does not list %s among permanent redirect sources",
    (legacyPath) => {
      expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(legacyPath);
      expect(hrefTargetsPermanentRedirectSource(legacyPath)).toBe(false);
    },
  );

  it.each(RETIRED_SPONSOR_DASHBOARD_APP_DIRS)(
    "does not ship an App Router page under %s",
    (appDir) => {
      expect(existsSync(join(appDir, "page.tsx"))).toBe(false);
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
    },
  );
});

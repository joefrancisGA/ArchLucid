import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";
import {
  LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH,
  LEGACY_PORTFOLIO_OVERVIEW_PATH,
} from "@/lib/ui-route-traffic-architecture-executive-dashboard";

import nextConfig from "../../../next.config";

const RETIRED_EXECUTIVE_DASHBOARD_APP_DIRS = [
  join(process.cwd(), "src", "app", "(executive)", "executive", "dashboard"),
  join(process.cwd(), "src", "app", "(operator)", "executive", "dashboard"),
  join(process.cwd(), "src", "app", "(operator)", "dashboard"),
] as const;

const RETIRED_EXECUTIVE_DASHBOARD_PATHS = [
  LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH,
  LEGACY_PORTFOLIO_OVERVIEW_PATH,
] as const;

describe("executive-dashboard retired bookmarks (EDA / TB-1525)", () => {
  it("keeps canonical executive dashboard on /architecture/executive-dashboard", () => {
    expect(EXECUTIVE_DASHBOARD_HREF).toBe("/architecture/executive-dashboard");
  });

  it.each(RETIRED_EXECUTIVE_DASHBOARD_PATHS)(
    "does not ship a next.config redirect for %s",
    async (legacyPath) => {
      const redirectRules = await nextConfig.redirects?.();

      expect(redirectRules?.find((entry) => entry.source === legacyPath)).toBeUndefined();
      expect(redirectRules?.find((entry) => entry.source === `${legacyPath}/:path*`)).toBeUndefined();
    },
  );

  it.each(RETIRED_EXECUTIVE_DASHBOARD_PATHS)(
    "does not list %s among permanent redirect sources",
    (legacyPath) => {
      expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(legacyPath);
      expect(hrefTargetsPermanentRedirectSource(legacyPath)).toBe(false);
    },
  );

  it.each(RETIRED_EXECUTIVE_DASHBOARD_APP_DIRS)(
    "does not ship an App Router page under %s",
    (appDir) => {
      expect(existsSync(join(appDir, "page.tsx"))).toBe(false);
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
    },
  );
});

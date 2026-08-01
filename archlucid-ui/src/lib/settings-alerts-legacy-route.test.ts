import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";

import nextConfig from "../../next.config";

/** Retired pre-release path — do not reintroduce redirect or App Router stub (TB-1886–TB-1890). */
const RETIRED_SETTINGS_ALERTS_PATH = "/settings/alerts";

const RETIRED_SETTINGS_ALERTS_APP_DIR = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "settings",
  "alerts",
);

describe("settings-alerts retired route (TB-1886–TB-1890)", () => {
  it("does not ship a next.config redirect for /settings/alerts", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((entry) => entry.source === RETIRED_SETTINGS_ALERTS_PATH)).toBeUndefined();
  });

  it("does not list /settings/alerts among permanent redirect sources", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(RETIRED_SETTINGS_ALERTS_PATH);
    expect(hrefTargetsPermanentRedirectSource(RETIRED_SETTINGS_ALERTS_PATH)).toBe(false);
  });

  it("does not ship an App Router page or layout under settings/alerts", () => {
    expect(existsSync(join(RETIRED_SETTINGS_ALERTS_APP_DIR, "page.tsx"))).toBe(false);
    expect(existsSync(join(RETIRED_SETTINGS_ALERTS_APP_DIR, "layout.tsx"))).toBe(false);
  });
});

import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";
import {
  CANONICAL_EXEC_DIGEST_SCHEDULE_PATH,
  RETIRED_SETTINGS_EXEC_DIGEST_PATH,
} from "@/lib/settings-exec-digest-legacy-route";
import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/settings-admin-route-paths";

import nextConfig from "../../next.config";

const RETIRED_SETTINGS_EXEC_DIGEST_APP_DIR = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "settings",
  "exec-digest",
);

describe("settings-exec-digest retired route (EEX / TB-1901–TB-1905)", () => {
  it("keeps canonical schedule on Digests Schedule tab", () => {
    expect(CANONICAL_EXEC_DIGEST_SCHEDULE_PATH).toBe(DIGESTS_SCHEDULE_TAB_PATH);
    expect(CANONICAL_EXEC_DIGEST_SCHEDULE_PATH).toBe("/architecture/digests?tab=schedule");
  });

  it("does not ship a next.config redirect for /settings/exec-digest", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((entry) => entry.source === RETIRED_SETTINGS_EXEC_DIGEST_PATH)).toBeUndefined();
  });

  it("does not list /settings/exec-digest among permanent redirect sources", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(RETIRED_SETTINGS_EXEC_DIGEST_PATH);
    expect(hrefTargetsPermanentRedirectSource(RETIRED_SETTINGS_EXEC_DIGEST_PATH)).toBe(false);
  });

  it("does not ship an App Router page or layout under settings/exec-digest", () => {
    expect(existsSync(join(RETIRED_SETTINGS_EXEC_DIGEST_APP_DIR, "page.tsx"))).toBe(false);
    expect(existsSync(join(RETIRED_SETTINGS_EXEC_DIGEST_APP_DIR, "layout.tsx"))).toBe(false);
  });
});

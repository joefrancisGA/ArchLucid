import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";

import nextConfig from "../../next.config";

const RETIRED_ALERT_ROUTING_PATH = "/alert-routing";
const RETIRED_APP_DIR = join(process.cwd(), "src", "app", "(operator)", "alert-routing");

describe("alert-routing retired route (pre-release prune)", () => {
  it("does not ship a next.config redirect", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((entry) => entry.source === RETIRED_ALERT_ROUTING_PATH)).toBeUndefined();
  });

  it("is not listed among permanent redirect sources", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(RETIRED_ALERT_ROUTING_PATH);
    expect(hrefTargetsPermanentRedirectSource(RETIRED_ALERT_ROUTING_PATH)).toBe(false);
  });

  it("does not ship an App Router stub", () => {
    expect(existsSync(join(RETIRED_APP_DIR, "page.tsx"))).toBe(false);
  });
});

import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";

import nextConfig from "../../next.config";

const RETIRED_VALUE_REPORT_PATH = "/value-report";
const RETIRED_APP_DIR = join(process.cwd(), "src", "app", "(operator)", "value-report");

describe("value-report retired route (IA batch 4)", () => {
  it("does not ship a next.config redirect", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((entry) => entry.source === RETIRED_VALUE_REPORT_PATH)).toBeUndefined();
    expect(redirectRules?.find((entry) => entry.source === `${RETIRED_VALUE_REPORT_PATH}/:path*`)).toBeUndefined();
  });

  it("is not listed among permanent redirect sources", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(RETIRED_VALUE_REPORT_PATH);
    expect(hrefTargetsPermanentRedirectSource(RETIRED_VALUE_REPORT_PATH)).toBe(false);
    expect(hrefTargetsPermanentRedirectSource("/value-report/roi")).toBe(false);
  });

  it("does not ship an App Router tree", () => {
    expect(existsSync(join(RETIRED_APP_DIR, "layout.tsx"))).toBe(false);
    expect(existsSync(join(RETIRED_APP_DIR, "sponsor-report", "page.tsx"))).toBe(false);
  });
});

import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";

import nextConfig from "../../next.config";

const RETIRED_MANIFESTS_PATH = "/manifests";
const RETIRED_APP_DIR = join(process.cwd(), "src", "app", "(operator)", "manifests");

describe("manifests retired route (IA batch 3)", () => {
  it("does not ship a next.config redirect", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((entry) => entry.source === RETIRED_MANIFESTS_PATH)).toBeUndefined();
    expect(redirectRules?.find((entry) => entry.source === `${RETIRED_MANIFESTS_PATH}/:path*`)).toBeUndefined();
  });

  it("does not ship a rewrite shim — use /signed-records or canonical /governance/sealed-records", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules?.find((entry) => entry.source === RETIRED_MANIFESTS_PATH)).toBeUndefined();
    expect(rewriteRules?.find((entry) => entry.source === `${RETIRED_MANIFESTS_PATH}/:path*`)).toBeUndefined();
  });

  it("is not listed among permanent redirect sources", () => {
    expect(NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS).not.toContain(RETIRED_MANIFESTS_PATH);
    expect(hrefTargetsPermanentRedirectSource(RETIRED_MANIFESTS_PATH)).toBe(false);
    expect(hrefTargetsPermanentRedirectSource("/manifests/demo-id")).toBe(false);
  });

  it("does not ship an App Router stub", () => {
    expect(existsSync(join(RETIRED_APP_DIR, "page.tsx"))).toBe(false);
  });
});

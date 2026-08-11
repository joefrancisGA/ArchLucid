import { describe, expect, it } from "vitest";

import { CLI_USAGE_HELP_PATH, RETIRED_CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";
import { CLI_USAGE_HELP_ROUTE_METADATA } from "@/lib/cli-usage-help-route-metadata";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

describe("cli-usage-help-route", () => {
  it("serves the internal runbook off /internal/cli-usage", () => {
    expect(CLI_USAGE_HELP_PATH).toBe("/internal/cli-usage");
    expect(RETIRED_CLI_USAGE_HELP_PATH).toBe("/help/cli-usage");
  });

  it("marks the internal runbook as noindex with honest metadata", () => {
    expect(CLI_USAGE_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(CLI_USAGE_HELP_ROUTE_METADATA.title).toBe("CLI usage");
  });

  it("stays under marketing disallow prefixes and out of the sitemap", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain("/internal/");
    expect(CLI_USAGE_HELP_PATH.startsWith("/internal/")).toBe(true);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(CLI_USAGE_HELP_PATH);
  });
});

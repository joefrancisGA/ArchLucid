import { describe, expect, it } from "vitest";

import { CLI_USAGE_HELP_PATH, RETIRED_CLI_USAGE_INTERNAL_PATH } from "@/lib/cli-usage-help-route";
import { CLI_USAGE_HELP_ROUTE_METADATA } from "@/lib/cli-usage-help-route-metadata";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

describe("cli-usage-help-route", () => {
  it("serves the runbook off the authority-gated /help/cli-usage topic", () => {
    expect(CLI_USAGE_HELP_PATH).toBe("/help/cli-usage");
    expect(RETIRED_CLI_USAGE_INTERNAL_PATH).toBe("/internal/cli-usage");
  });

  it("marks the internal runbook as noindex with honest metadata", () => {
    expect(CLI_USAGE_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(CLI_USAGE_HELP_ROUTE_METADATA.title).toBe("CLI usage");
  });

  it("stays under marketing disallow prefixes and out of the sitemap", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain("/help");
    expect(CLI_USAGE_HELP_PATH.startsWith("/help")).toBe(true);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(CLI_USAGE_HELP_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(RETIRED_CLI_USAGE_INTERNAL_PATH);
  });
});

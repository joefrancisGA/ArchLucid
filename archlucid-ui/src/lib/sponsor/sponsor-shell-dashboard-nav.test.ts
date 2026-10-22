import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  LEGACY_SPONSOR_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH,
} from "@/lib/ui-route-traffic-architecture-sponsor-dashboard";

const SPONSOR_SHELL_FRAME_SOURCE = join(process.cwd(), "src", "components", "SponsorShellFrame.tsx");

describe("sponsor shell dashboard nav (TB-1526)", () => {
  it("links Dashboard to the canonical sponsor dashboard route", () => {
    const source = readFileSync(SPONSOR_SHELL_FRAME_SOURCE, "utf8");

    expect(source).toContain('data-testid="sponsor-shell-nav-dashboard"');
    expect(source).toContain("href={SPONSOR_DASHBOARD_HREF}");
    expect(source).toContain("isSponsorDashboardPath(pathname)");
    expect(source).not.toContain(`href="${LEGACY_SPONSOR_SHELL_DASHBOARD_PATH}"`);
    expect(source).not.toContain(`href="${LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH}"`);
    expect(source).not.toContain('startsWith("/sponsor/dashboard")');
  });

  it("keeps wordmark handoff on the canonical sponsor dashboard", () => {
    const source = readFileSync(SPONSOR_SHELL_FRAME_SOURCE, "utf8");

    expect(source).toContain(`href={SPONSOR_DASHBOARD_HREF}`);
    expect(SPONSOR_DASHBOARD_HREF).toBe("/architecture/sponsor-dashboard");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import {
  LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH,
} from "@/lib/ui-route-traffic-architecture-executive-dashboard";

const EXECUTIVE_SHELL_FRAME_SOURCE = join(process.cwd(), "src", "components", "ExecutiveShellFrame.tsx");

describe("executive shell dashboard nav (TB-1526)", () => {
  it("links Dashboard to the canonical executive dashboard route", () => {
    const source = readFileSync(EXECUTIVE_SHELL_FRAME_SOURCE, "utf8");

    expect(source).toContain('data-testid="executive-shell-nav-dashboard"');
    expect(source).toContain("href={EXECUTIVE_DASHBOARD_HREF}");
    expect(source).toContain("isExecutiveDashboardPath(pathname)");
    expect(source).not.toContain(`href="${LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH}"`);
    expect(source).not.toContain(`href="${LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH}"`);
    expect(source).not.toContain('startsWith("/executive/dashboard")');
  });

  it("keeps wordmark handoff on the canonical executive dashboard", () => {
    const source = readFileSync(EXECUTIVE_SHELL_FRAME_SOURCE, "utf8");

    expect(source).toContain(`href={EXECUTIVE_DASHBOARD_HREF}`);
    expect(EXECUTIVE_DASHBOARD_HREF).toBe("/architecture/executive-dashboard");
  });
});

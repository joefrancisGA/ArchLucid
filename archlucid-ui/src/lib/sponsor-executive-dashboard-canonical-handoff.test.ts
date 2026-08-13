import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import {
  LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH,
} from "@/lib/ui-route-traffic-architecture-executive-dashboard";

const SPONSOR_EXECUTIVE_DASHBOARD_HANDOFF_SURFACES = [
  "src/lib/sponsor-executive-shell-redirect.ts",
  "src/components/executive/ExecutiveScorecardEmptyState.tsx",
  "src/components/ExecutiveShellFrame.tsx",
] as const;

const CANONICAL_EXECUTIVE_DASHBOARD_HANDOFF_MARKERS = [
  EXECUTIVE_DASHBOARD_HREF,
  "EXECUTIVE_DASHBOARD_HREF",
  "isExecutiveDashboardPath",
] as const;

function expectCanonicalExecutiveDashboardHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_EXECUTIVE_DASHBOARD_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("sponsor executive dashboard canonical handoff (TB-1529)", () => {
  it.each(SPONSOR_EXECUTIVE_DASHBOARD_HANDOFF_SURFACES)(
    "keeps %s on canonical executive dashboard targets",
    (relativePath) => {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expectCanonicalExecutiveDashboardHandoff(source);
      expect(source).not.toContain(`href="${LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`href="${LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`"${LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`"${LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH}"`);
    },
  );
});

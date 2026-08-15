import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  LEGACY_SPONSOR_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH,
} from "@/lib/ui-route-traffic-architecture-sponsor-dashboard";

const SPONSOR_DASHBOARD_HANDOFF_SURFACES = [
  "src/lib/sponsor-shell-redirect.ts",
  "src/components/sponsor/SponsorScorecardEmptyState.tsx",
  "src/components/SponsorShellFrame.tsx",
] as const;

const CANONICAL_SPONSOR_DASHBOARD_HANDOFF_MARKERS = [
  SPONSOR_DASHBOARD_HREF,
  "SPONSOR_DASHBOARD_HREF",
  "isSponsorDashboardPath",
] as const;

function expectCanonicalSponsorDashboardHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_SPONSOR_DASHBOARD_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("sponsor sponsor dashboard canonical handoff (TB-1529)", () => {
  it.each(SPONSOR_DASHBOARD_HANDOFF_SURFACES)(
    "keeps %s on canonical sponsor dashboard targets",
    (relativePath) => {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expectCanonicalSponsorDashboardHandoff(source);
      expect(source).not.toContain(`href="${LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`href="${LEGACY_SPONSOR_SHELL_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`"${LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`"${LEGACY_SPONSOR_SHELL_DASHBOARD_PATH}"`);
    },
  );
});

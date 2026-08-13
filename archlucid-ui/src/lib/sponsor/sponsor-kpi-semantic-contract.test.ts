import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  SPONSOR_KPI_SEMANTIC_CONTRACT,
  listDashboardForbiddenPatternOffenders,
} from "@/lib/sponsor/sponsor-kpi-semantic-contract";

const __dirname = dirname(fileURLToPath(import.meta.url));
const liveKpiCardsPath = join(
  __dirname,
  "..",
  "..",
  "app",
  "(operator)",
  "architecture",
  "sponsor-dashboard",
  "_sections",
  "SponsorRoiDashboardLiveKpiCards.tsx",
);

describe("SPONSOR_KPI_SEMANTIC_CONTRACT (TB-168)", () => {
  it("loads required server-authoritative fields", () => {
    const ids = SPONSOR_KPI_SEMANTIC_CONTRACT.fields.map((field) => field.id);

    expect(ids).toContain("expiringWaivers.dashboard");
    expect(ids).toContain("decisionsNeeded.total");
    expect(ids).toContain("orphanCandidates.summary");
    expect(ids).toContain("reports.costWaste");
  });

  it("live KPI cards do not use banned expiring-waiver or local-sum heuristics", () => {
    const src = readFileSync(liveKpiCardsPath, "utf8");
    const offenders = listDashboardForbiddenPatternOffenders(src);

    expect(offenders, "Use governance decisions-needed summary only.").toEqual([]);
    expect(src).toContain("decisionsNeeded.waiversExpiringWithin14Days");
    expect(src).not.toMatch(/expiringWaiversCount14Days\s*\?\?/);
  });
});

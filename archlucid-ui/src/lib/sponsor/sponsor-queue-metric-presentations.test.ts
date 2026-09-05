import { describe, expect, it } from "vitest";

import { SPONSOR_KPI_DRILL_THROUGH } from "@/lib/sponsor/sponsor-kpi-drill-through-hrefs";
import {
  sponsorDecisionsNeededPresentation,
  sponsorStaleArchitectureRisksPresentation,
} from "@/lib/sponsor/sponsor-queue-metric-presentations";

describe("sponsor queue metric presentations", () => {
  it("aligns stale-risks drill-through with the stale filter", () => {
    const presentation = sponsorStaleArchitectureRisksPresentation(3);

    expect(presentation.href).toBe(SPONSOR_KPI_DRILL_THROUGH.staleArchitectureRisks);
    expect(presentation.href).toContain("filter=stale");
  });

  it("aligns decisions-needed drill-through with the needs-decision filter", () => {
    const presentation = sponsorDecisionsNeededPresentation(2);

    expect(presentation.href).toBe(SPONSOR_KPI_DRILL_THROUGH.decisionsNeeded);
    expect(presentation.href).toContain("filter=needs-decision");
  });
});

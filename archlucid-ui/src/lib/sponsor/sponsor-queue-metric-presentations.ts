import {
  governanceRegisterMetricPresentation,
  type MetricCountPresentation,
} from "@/lib/metric-count-presentation";
import { SPONSOR_KPI_DRILL_THROUGH } from "@/lib/sponsor/sponsor-kpi-drill-through-hrefs";

export function sponsorDecisionsNeededPresentation(count: number): MetricCountPresentation {
  return governanceRegisterMetricPresentation({
    count,
    noun: count === 1 ? "decision needed" : "decisions needed",
    filter: "needs-decision",
  });
}

export function sponsorStaleArchitectureRisksPresentation(count: number): MetricCountPresentation {
  return governanceRegisterMetricPresentation({
    count,
    noun: count === 1 ? "stale architecture risk" : "stale architecture risks",
    filter: "stale",
  });
}

export function sponsorNewlyDiscoveredFindingsPresentation(count: number): MetricCountPresentation {
  return governanceRegisterMetricPresentation({
    count,
    noun: count === 1 ? "newly discovered finding" : "newly discovered findings",
    filter: "open",
  });
}

export function sponsorExpiringWaiversPresentation(count: number): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "expiring waiver" : "expiring waivers",
    dimensions: [{ kind: "workspace" }],
    href: SPONSOR_KPI_DRILL_THROUGH.expiringWaivers,
  };
}

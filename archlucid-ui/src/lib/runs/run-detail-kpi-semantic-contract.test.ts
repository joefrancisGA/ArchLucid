import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_KPI_SEMANTIC_CONTRACT,
  listRunDetailForbiddenPatternOffenders,
  presentRunDetailKpiFlag,
} from "@/lib/runs/run-detail-kpi-semantic-contract";
import { APP_ROOT, SRC_ROOT } from "@/lib/testing/repo-paths";

const runDetailPagePath = join(
  APP_ROOT,
  "(operator)",
  "architecture",
  "reviews",
  "[runId]",
  "_sections",
  "RunDetailPageView.tsx",
);
const outcomeCardsPath = join(SRC_ROOT, "components", "runs", "RunDetailOutcomeCards.tsx");

describe("RUN_DETAIL_KPI_SEMANTIC_CONTRACT (TB-320)", () => {
  it("loads required server-authoritative run-detail fields", () => {
    const ids = RUN_DETAIL_KPI_SEMANTIC_CONTRACT.fields.map((field) => field.id);

    expect(ids).toContain("findingCoverage.hasCommitBlockingFailures");
    expect(ids).toContain("findingCoverage.dispositionCoverage");
    expect(ids).toContain("governance.hasGovernanceWarnings");
    expect(ids).toContain("operator.llmCostEstimate");
  });

  it("run detail surfaces do not recompute commit-blocking or disposition KPIs", () => {
    const pageSrc = readFileSync(runDetailPagePath, "utf8");
    const cardsSrc = readFileSync(outcomeCardsPath, "utf8");

    expect(listRunDetailForbiddenPatternOffenders(pageSrc)).toEqual([]);
    expect(listRunDetailForbiddenPatternOffenders(cardsSrc)).toEqual([]);
    expect(pageSrc).toContain("findingCoverageSummary?.hasCommitBlockingFailures");
    expect(cardsSrc).toContain("findingCoverageSummary");
  });

  it("presentRunDetailKpiFlag renders server booleans without inventing values", () => {
    expect(presentRunDetailKpiFlag(true).display).toBe("Yes");
    expect(presentRunDetailKpiFlag(false).display).toBe("No");
    expect(presentRunDetailKpiFlag(undefined, { loading: true }).display).toBe("—");
  });
});

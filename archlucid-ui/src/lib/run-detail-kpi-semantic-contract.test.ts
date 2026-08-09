import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_KPI_SEMANTIC_CONTRACT,
  listRunDetailForbiddenPatternOffenders,
  presentRunDetailKpiFlag,
} from "@/lib/run-detail-kpi-semantic-contract";

const __dirname = dirname(fileURLToPath(import.meta.url));
const runDetailPagePath = join(
  __dirname,
  "..",
  "app",
  "(operator)",
  "architecture",
  "reviews",
  "[runId]",
  "_sections",
  "RunDetailPageView.tsx",
);
const outcomeCardsPath = join(__dirname, "..", "components", "RunDetailOutcomeCards.tsx");

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

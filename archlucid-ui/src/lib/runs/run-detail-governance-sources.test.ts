import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES,
} from "@/lib/runs/run-detail-governance-sources";

describe("run-detail-governance-sources", () => {
  it("lists inline help cites for governance and audit trail", () => {
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES.some((link) => link.href.includes("governance-approval"))).toBe(
      true,
    );
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES.some((link) => link.href.includes("audit-trail"))).toBe(true);
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES).toHaveLength(2);
  });

  it("states claim discipline without implying certification", () => {
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE.toLowerCase()).toContain("not the committed");
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE.endsWith(".")).toBe(true);
  });
});

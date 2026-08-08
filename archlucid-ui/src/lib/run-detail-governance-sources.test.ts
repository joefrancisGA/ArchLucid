import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SOURCES,
} from "@/lib/run-detail-governance-sources";

describe("run-detail-governance-sources", () => {
  it("lists Sources that land on product help or governance surfaces", () => {
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SOURCES.some((link) => link.href.includes("governance-approval"))).toBe(
      true,
    );
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SOURCES.some((link) => link.href.includes("audit-trail"))).toBe(true);
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SOURCES.some((link) => link.href === "/governance/findings")).toBe(true);
  });

  it("states claim discipline without implying certification", () => {
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE.toLowerCase()).toContain("not the committed");
    expect(RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
  });
});

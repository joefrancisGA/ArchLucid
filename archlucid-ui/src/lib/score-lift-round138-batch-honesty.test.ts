import { describe, expect, it } from "vitest";
import { DRIFT_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/infra-evidence/drift-workbench-ranked-path-ask-handoff-copy";
import { GOVERNANCE_FINDINGS_QUEUE_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/governance/governance-findings-queue-ranked-path-ask-handoff-copy";
describe("score lift round138 batch honesty", () => {
  it("drift and findings RankedPath handoff copy stays rank-neutral", () => {
    expect(DRIFT_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("stored path id");
    expect(GOVERNANCE_FINDINGS_QUEUE_RANKED_PATH_ASK_SCOPE_LINE).toContain("unchanged");
  });
});

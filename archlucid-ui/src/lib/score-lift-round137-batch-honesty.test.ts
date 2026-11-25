import { describe, expect, it } from "vitest";
import { INFRASTRUCTURE_ASK_EVIDENCE_ROW_CAP_LINE, INFRASTRUCTURE_ASK_RANKED_PATH_SCOPE_LINE } from "@/lib/infra-evidence/infrastructure-ask-ranked-path-honesty-copy";
import { REMEDIATION_FACTORY_RANKED_PATH_ASK_HANDOFF_LABEL } from "@/lib/remediation-factory/remediation-factory-ranked-path-ask-handoff-copy";
describe("score lift round137 batch honesty", () => {
  it("RankedPath Ask discipline stays rank-neutral", () => {
    expect(INFRASTRUCTURE_ASK_RANKED_PATH_SCOPE_LINE).toContain("does not change the rank");
    expect(INFRASTRUCTURE_ASK_EVIDENCE_ROW_CAP_LINE).toContain("50");
    expect(REMEDIATION_FACTORY_RANKED_PATH_ASK_HANDOFF_LABEL).toContain("stored path");
  });
});

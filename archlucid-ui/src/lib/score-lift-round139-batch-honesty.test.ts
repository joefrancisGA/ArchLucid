import { describe, expect, it } from "vitest";
import { REMEDIATION_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/infra-evidence/remediation-workbench-ranked-path-ask-handoff-copy";
import { RESOURCE_HUB_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/infra-evidence/resource-hub-ranked-path-ask-handoff-copy";

describe("score lift round139 batch honesty", () => {
  it("remediation workbench and resource hub RankedPath handoff copy stays rank-neutral", () => {
    expect(REMEDIATION_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("stored path id");
    expect(REMEDIATION_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("unchanged");
    expect(RESOURCE_HUB_RANKED_PATH_ASK_SCOPE_LINE).toContain("stored path id");
    expect(RESOURCE_HUB_RANKED_PATH_ASK_SCOPE_LINE).toContain("unchanged");
  });
});

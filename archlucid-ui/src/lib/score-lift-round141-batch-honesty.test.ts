import { describe, expect, it } from "vitest";
import { RESOURCES_EXPLORER_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/infra-evidence/resources-explorer-ranked-path-ask-handoff-copy";
import { TERRAFORM_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/infra-evidence/terraform-workbench-ranked-path-ask-handoff-copy";
describe("score lift round141 batch honesty", () => {
  it("explorer and terraform RankedPath handoff copy stays rank-neutral", () => {
    expect(RESOURCES_EXPLORER_RANKED_PATH_ASK_SCOPE_LINE).toContain("stored path id");
    expect(RESOURCES_EXPLORER_RANKED_PATH_ASK_SCOPE_LINE).toContain("unchanged");
    expect(TERRAFORM_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("stored path id");
    expect(TERRAFORM_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("unchanged");
  });
});
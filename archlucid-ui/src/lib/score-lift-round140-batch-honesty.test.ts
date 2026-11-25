import { describe, expect, it } from "vitest";
import { DIAGRAMS_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/infra-evidence/diagrams-workbench-ranked-path-ask-handoff-copy";
import { DIAGRAM_RECONCILE_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE } from "@/lib/infra-evidence/diagram-reconcile-workbench-ranked-path-ask-handoff-copy";

describe("score lift round140 batch honesty", () => {
  it("diagram workbenches RankedPath handoff copy stays rank-neutral", () => {
    expect(DIAGRAMS_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("stored path id");
    expect(DIAGRAMS_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("unchanged");
    expect(DIAGRAM_RECONCILE_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("stored path id");
    expect(DIAGRAM_RECONCILE_WORKBENCH_RANKED_PATH_ASK_SCOPE_LINE).toContain("unchanged");
  });
});

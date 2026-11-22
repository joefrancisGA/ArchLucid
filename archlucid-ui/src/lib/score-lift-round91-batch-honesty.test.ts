import { describe, expect, it } from "vitest";
import { COMPARE_VERDICT_ADD_REMOVE_TWO_SEALED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-verdict-add-remove-two-sealed-not-load-failure-copy";
import { COMPARE_EXECUTION_MODE_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-execution-mode-one-unsealed-not-load-failure-copy";
import { COMPARE_PROVENANCE_DELTA_PARTIAL_INVENTORY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-provenance-delta-partial-inventory-not-load-failure-copy";
import { COMPARE_AGENT_RESULTS_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-agent-results-empty-not-load-failure-copy";

describe("score-lift round91 batch honesty", () => {
  it("verdict, execution mode, provenance, agent results", () => {
    expect(COMPARE_VERDICT_ADD_REMOVE_TWO_SEALED_NOT_LOAD_FAILURE_LINE).toContain("sealed");
    expect(COMPARE_EXECUTION_MODE_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE).toContain("sealed");
    expect(COMPARE_PROVENANCE_DELTA_PARTIAL_INVENTORY_NOT_LOAD_FAILURE_LINE).toContain("partial");
    expect(COMPARE_AGENT_RESULTS_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("no rows");
  });
});

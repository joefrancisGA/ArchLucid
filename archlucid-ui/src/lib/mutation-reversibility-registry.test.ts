import { describe, expect, it } from "vitest";

import {
  getMutationReversibilityEntry,
  mutationReversibilityConfirmationDetail,
  mutationSupportsUndoWindow,
  MUTATION_REVERSIBILITY_REGISTRY,
} from "@/lib/mutation-reversibility-registry";

describe("mutation-reversibility-registry (TB-2148)", () => {
  it("classifies every governed governance mutation", () => {
    expect(Object.keys(MUTATION_REVERSIBILITY_REGISTRY)).toHaveLength(8);
    expect(getMutationReversibilityEntry("governance_bulk_disposition").classification).toBe("reversible");
    expect(getMutationReversibilityEntry("governance_quick_approve").classification).toBe("permanent");
  });

  it("exposes confirmation detail for permanent mutations", () => {
    expect(mutationReversibilityConfirmationDetail("governance_policy_pack_publish")).toMatch(/cannot be unpublished/i);
  });

  it("enables undo window only for reversible mutations", () => {
    expect(mutationSupportsUndoWindow("governance_bulk_disposition")).toBe(true);
    expect(mutationSupportsUndoWindow("governance_workflow_approve")).toBe(false);
  });
});

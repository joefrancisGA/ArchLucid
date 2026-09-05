import { describe, expect, it } from "vitest";

import {
  getMutationReversibilityEntry,
  mutationReversibilityConfirmationDetail,
  mutationSupportsAmend,
  mutationSupportsUndoWindow,
  MUTATION_REVERSIBILITY_REGISTRY,
  MUTATION_UNDO_WINDOW_SECONDS,
} from "@/lib/mutation-reversibility-registry";

describe("mutation-reversibility-registry (TB-2148)", () => {
  it("classifies every governed governance mutation", () => {
    expect(Object.keys(MUTATION_REVERSIBILITY_REGISTRY).sort()).toEqual([
      "governance_architecture_review_finalize",
      "governance_bulk_disposition",
      "governance_keyboard_finding_disposition",
      "governance_policy_pack_publish",
      "governance_quick_approve",
      "governance_workflow_activate",
      "governance_workflow_approve",
      "governance_workflow_promote",
      "governance_workflow_reject",
      "platform_bundled_policy_pack_activate",
      "platform_bundled_policy_pack_deactivate",
    ]);
    expect(getMutationReversibilityEntry("governance_bulk_disposition").classification).toBe("reversible");
    expect(getMutationReversibilityEntry("governance_workflow_approve").classification).toBe("reversible_with_audit");
    expect(getMutationReversibilityEntry("governance_quick_approve").classification).toBe("reversible_with_audit");
  });

  it("exposes confirmation detail for permanent mutations", () => {
    expect(mutationReversibilityConfirmationDetail("governance_policy_pack_publish")).toMatch(/cannot be unpublished/i);
    expect(mutationReversibilityConfirmationDetail("governance_policy_pack_publish")).toMatch(/audit trail|support/i);
    expect(mutationReversibilityConfirmationDetail("governance_policy_pack_publish")).not.toMatch(/record a correction there/i);
  });

  it("promises record correction only when amend is supported", () => {
    expect(mutationSupportsAmend("governance_quick_approve")).toBe(true);
    expect(mutationSupportsAmend("governance_bulk_disposition")).toBe(true);
    expect(mutationSupportsAmend("governance_keyboard_finding_disposition")).toBe(true);
    expect(mutationSupportsAmend("governance_architecture_review_finalize")).toBe(true);
    expect(mutationSupportsAmend("platform_bundled_policy_pack_activate")).toBe(false);
    expect(mutationSupportsAmend("governance_policy_pack_publish")).toBe(false);
    expect(mutationReversibilityConfirmationDetail("governance_quick_approve")).toMatch(/record correction/i);
  });

  it("keeps finding disposition undo window at 300 seconds", () => {
    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);
    expect(getMutationReversibilityEntry("governance_bulk_disposition").undoWindowSeconds).toBe(300);
  });

  it("enables undo window only for reversible mutations", () => {
    expect(mutationSupportsUndoWindow("governance_bulk_disposition")).toBe(true);
    expect(mutationSupportsUndoWindow("governance_workflow_approve")).toBe(false);
  });
});

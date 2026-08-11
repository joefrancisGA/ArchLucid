/** How a governed mutation can be reversed after confirm (TB-2148). */
export type MutationReversibilityClass = "reversible" | "reversible_with_audit" | "permanent";

export type GovernanceMutationReversibilityId =
  | "governance_quick_approve"
  | "governance_workflow_approve"
  | "governance_workflow_reject"
  | "governance_workflow_promote"
  | "governance_workflow_activate"
  | "governance_bulk_disposition"
  | "governance_keyboard_finding_disposition"
  | "governance_policy_pack_publish";

export type MutationReversibilityEntry = {
  readonly id: GovernanceMutationReversibilityId;
  readonly classification: MutationReversibilityClass;
  readonly confirmationLead: string;
  readonly undoWindowSeconds?: number;
};

export const MUTATION_UNDO_WINDOW_SECONDS = 10;

export const MUTATION_REVERSIBILITY_REGISTRY: Readonly<
  Record<GovernanceMutationReversibilityId, MutationReversibilityEntry>
> = {
  governance_quick_approve: {
    id: "governance_quick_approve",
    classification: "permanent",
    confirmationLead:
      "This records a governance approval on the signed review record. It cannot be undone from this workspace.",
  },
  governance_workflow_approve: {
    id: "governance_workflow_approve",
    classification: "permanent",
    confirmationLead:
      "Approving this request updates the governance workflow state. It cannot be undone from this workspace.",
  },
  governance_workflow_reject: {
    id: "governance_workflow_reject",
    classification: "permanent",
    confirmationLead:
      "Rejecting this request updates the governance workflow state. It cannot be undone from this workspace.",
  },
  governance_workflow_promote: {
    id: "governance_workflow_promote",
    classification: "permanent",
    confirmationLead:
      "Promoting this pack applies it to the target environment for future governed changes. It cannot be undone from this workspace.",
  },
  governance_workflow_activate: {
    id: "governance_workflow_activate",
    classification: "permanent",
    confirmationLead:
      "Activating this pack applies its rules to future governed changes in this environment. It cannot be undone from this workspace.",
  },
  governance_bulk_disposition: {
    id: "governance_bulk_disposition",
    classification: "reversible",
    confirmationLead:
      "Disposition changes are recorded on the evidence trail. You can undo within 10 seconds after confirming to defer findings for revisit.",
    undoWindowSeconds: MUTATION_UNDO_WINDOW_SECONDS,
  },
  governance_keyboard_finding_disposition: {
    id: "governance_keyboard_finding_disposition",
    classification: "reversible",
    confirmationLead:
      "This disposition is recorded on the evidence trail. You can undo within 10 seconds after confirming to defer the finding for revisit.",
    undoWindowSeconds: MUTATION_UNDO_WINDOW_SECONDS,
  },
  governance_policy_pack_publish: {
    id: "governance_policy_pack_publish",
    classification: "permanent",
    confirmationLead:
      "Publishing creates an immutable version row for this policy pack. It cannot be unpublished from this workspace.",
  },
};

export function getMutationReversibilityEntry(
  mutationId: GovernanceMutationReversibilityId,
): MutationReversibilityEntry {
  return MUTATION_REVERSIBILITY_REGISTRY[mutationId];
}

export function mutationReversibilityConfirmationDetail(mutationId: GovernanceMutationReversibilityId): string {
  const entry = getMutationReversibilityEntry(mutationId);

  if (entry.classification === "reversible_with_audit") {
    return `${entry.confirmationLead} A new audit-trail entry will be created if you change this later.`;
  }

  if (entry.classification === "reversible") {
    return entry.confirmationLead;
  }

  return entry.confirmationLead;
}

export function mutationSupportsUndoWindow(mutationId: GovernanceMutationReversibilityId): boolean {
  return getMutationReversibilityEntry(mutationId).classification === "reversible";
}

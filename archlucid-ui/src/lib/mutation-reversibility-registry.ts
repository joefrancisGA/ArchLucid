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
  | "governance_policy_pack_publish"
  | "platform_bundled_policy_pack_activate"
  | "platform_bundled_policy_pack_deactivate"
  | "governance_architecture_review_finalize";

export type MutationReversibilityEntry = {
  readonly id: GovernanceMutationReversibilityId;
  readonly classification: MutationReversibilityClass;
  readonly confirmationLead: string;
  readonly undoWindowSeconds?: number;
  /** When true, operators can record an append-only correction on the audit trail after confirm. */
  readonly amendable?: boolean;
};

export const MUTATION_UNDO_WINDOW_SECONDS = 300;

export const FINDING_DISPOSITION_REVISIT_WINDOW_HOURS = 24;

export const MUTATION_REVERSIBILITY_REGISTRY: Readonly<
  Record<GovernanceMutationReversibilityId, MutationReversibilityEntry>
> = {
  governance_quick_approve: {
    id: "governance_quick_approve",
    classification: "reversible_with_audit",
    amendable: true,
    confirmationLead:
      "This records approval on the finalized review record. Prior approval remains on the audit trail; use Record correction after confirming if approval was mistaken.",
  },
  governance_workflow_approve: {
    id: "governance_workflow_approve",
    classification: "reversible_with_audit",
    amendable: true,
    confirmationLead:
      "Approving this request updates the approval workflow state. Prior approval remains on the audit trail; use Record correction after confirming if approval was mistaken.",
  },
  governance_workflow_reject: {
    id: "governance_workflow_reject",
    classification: "reversible_with_audit",
    amendable: true,
    confirmationLead:
      "Rejecting this request updates the approval workflow state. Prior rejection remains on the audit trail; use Record correction after confirming if rejection was mistaken.",
  },
  governance_workflow_promote: {
    id: "governance_workflow_promote",
    classification: "reversible_with_audit",
    amendable: true,
    confirmationLead:
      "Promoting this pack applies it to the target environment for future approved changes. Prior promotion remains on the audit trail; use Record correction after confirming if promotion was mistaken.",
  },
  governance_workflow_activate: {
    id: "governance_workflow_activate",
    classification: "reversible_with_audit",
    amendable: true,
    confirmationLead:
      "Activating this pack applies its rules to future approved changes in this environment. Prior activation remains on the audit trail; use Record correction after confirming if activation was mistaken.",
  },
  governance_bulk_disposition: {
    id: "governance_bulk_disposition",
    classification: "reversible",
    amendable: true,
    confirmationLead:
      "Disposition changes are recorded on the evidence trail. You can undo for several minutes after confirming, revisit deferred findings for 24 hours, or record a correction on the audit trail after confirming if the disposition was mistaken.",
    undoWindowSeconds: MUTATION_UNDO_WINDOW_SECONDS,
  },
  governance_keyboard_finding_disposition: {
    id: "governance_keyboard_finding_disposition",
    classification: "reversible",
    amendable: true,
    confirmationLead:
      "This disposition is recorded on the evidence trail. You can undo for several minutes after confirming, revisit deferred findings for 24 hours, or record a correction on the audit trail after confirming if the disposition was mistaken.",
    undoWindowSeconds: MUTATION_UNDO_WINDOW_SECONDS,
  },
  governance_policy_pack_publish: {
    id: "governance_policy_pack_publish",
    classification: "permanent",
    confirmationLead:
      "Publishing creates an immutable version row for this policy pack. It cannot be unpublished from this workspace. If this publish was mistaken, document the correction in the governance audit trail or contact support.",
  },
  platform_bundled_policy_pack_activate: {
    id: "platform_bundled_policy_pack_activate",
    classification: "reversible_with_audit",
    amendable: false,
    confirmationLead:
      "Activating this pack makes it available to every tenant. You can deactivate it later from this registry; changes are recorded on the audit trail.",
  },
  platform_bundled_policy_pack_deactivate: {
    id: "platform_bundled_policy_pack_deactivate",
    classification: "reversible_with_audit",
    amendable: false,
    confirmationLead:
      "Deactivating removes this pack from tenant workspaces and stops it from applying to reviews. You can activate it again later; changes are recorded on the audit trail.",
  },
  governance_architecture_review_finalize: {
    id: "governance_architecture_review_finalize",
    classification: "permanent",
    amendable: true,
    confirmationLead:
      "Finalizing creates an immutable sealed review record. The snapshot cannot be unsealed from this workspace. If this finalize was mistaken, use Record correction after confirming to append a rationale on the audit trail.",
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

export function mutationSupportsAmend(mutationId: GovernanceMutationReversibilityId): boolean {
  const entry = getMutationReversibilityEntry(mutationId);

  if (entry.amendable === false) {
    return false;
  }

  if (entry.amendable === true) {
    return true;
  }

  return entry.classification === "reversible_with_audit";
}

export const MUTATION_AMEND_ACTION_LABEL = "Record correction";

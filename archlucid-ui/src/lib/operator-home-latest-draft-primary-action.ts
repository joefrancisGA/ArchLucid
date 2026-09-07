import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { isArchitectureDraftInReviewIntake } from "@/lib/architecture/architecture-draft-intake-mode";
import {
  architectureDraftPath,
  startReviewFromArchitectureHref,
} from "@/lib/architecture/architecture-routes";
import {
  OPERATOR_HOME_CONTINUE_REVIEW_INTAKE_CTA,
  OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA,
} from "@/lib/buyer/buyer-polish-copy";

export type OperatorHomeLatestDraftPrimaryActionKind =
  | "resume-draft"
  | "continue-intake"
  | "continue-review";

export type OperatorHomeLatestDraftPrimaryAction = {
  readonly href: string;
  readonly ctaLabel: string;
  readonly kind: OperatorHomeLatestDraftPrimaryActionKind;
};

/** Registry rows that left drafting — intake frozen or a review already exists. */
export function isArchitectureDraftPastDraftingOnRegistryEntry(
  entry: ArchitectureDraftRegistryEntry,
): boolean {
  if (isArchitectureDraftInReviewIntake(entry.serverDraftStatus)) {
    return true;
  }

  // Legacy rows: Start a review from the draft workspace marks ready-for-review before intake opens.
  if (entry.customerStatus === "ready-for-review" && entry.serverDraftStatus !== "Submitted") {
    return true;
  }

  return false;
}

export function resolveOperatorHomeLatestDraftPrimaryAction(
  entry: ArchitectureDraftRegistryEntry | null | undefined,
): OperatorHomeLatestDraftPrimaryAction | null {
  if (entry === null || entry === undefined) {
    return null;
  }

  const draftId = entry.draftId.trim();

  if (draftId.length === 0) {
    return null;
  }

  const linkedReviewId = entry.linkedReviewId?.trim() ?? "";

  if (linkedReviewId.length > 0) {
    return null;
  }

  if (entry.serverDraftStatus === "Submitted") {
    return {
      href: architectureDraftPath(draftId),
      ctaLabel: OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA,
      kind: "resume-draft",
    };
  }

  if (isArchitectureDraftPastDraftingOnRegistryEntry(entry)) {
    return {
      href: startReviewFromArchitectureHref(draftId),
      ctaLabel: OPERATOR_HOME_CONTINUE_REVIEW_INTAKE_CTA,
      kind: "continue-intake",
    };
  }

  return {
    href: architectureDraftPath(draftId),
    ctaLabel: OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA,
    kind: "resume-draft",
  };
}

import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";

/** Inbox column label for reviews without a parent architecture (AO-49 / CA-18). */
export const WORKING_UNLINKED_REVIEW_INBOX_LABEL = "Unlinked review" as const;

export const WORKING_UNLINKED_REVIEW_HONESTY_TITLE =
  "This review is not linked to an architecture desk" as const;

export const WORKING_UNLINKED_REVIEW_HONESTY_COPY =
  "Open an architecture desk and link this review before treating it as a complete desk. ArchLucid will not invent a parent from system name on read." as const;

export const WORKING_UNLINKED_REVIEW_HONESTY_LINK = {
  href: ARCHITECTURES_LIST_PATH,
  label: "Open architecture desks",
} as const;

export function isUnlinkedArchitectureReviewJob(architectureId: string | null | undefined): boolean {
  return (architectureId?.trim() ?? "").length === 0;
}

import {
  ARCHITECTURES_NEW_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  CREATE_ARCHITECTURE_LABEL,
  START_REVIEW_LABEL,
  WORKING_NEW_REVIEW_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_NO_CREATE_ARCHITECTURE_VS_REVIEW_FORK_WORKING_DOC_ANCHOR =
  "docs/architecture/adrs/0069-working-desk-one-work-object.md" as const;

export const SYSTEM_NOT_JOB_NO_CREATE_ARCHITECTURE_VS_REVIEW_FORK_WORKING_OWNER = "SN-028" as const;

/** Working sidebar / palette tooltip — one sequence verb, not two peer start products (ADR 0069). */
export const WORKING_SINGLE_START_NAV_TOOLTIP =
  `${WORKING_NEW_REVIEW_LABEL} — resume last architecture or open the draft editor (Alt+N)` as const;

/** Grep ratchet — Guided keeps these labels; Working nav must not present them as peers. */
export const WORKING_NAV_BANNED_PEER_START_LABELS: readonly string[] = [
  CREATE_ARCHITECTURE_LABEL,
  START_REVIEW_LABEL,
];

export function isWorkingSingleStartNavHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;

  return path === ARCHITECTURES_NEW_PATH || path === REVIEWS_NEW_PATH;
}

export type WorkingSingleStartNavPresentation = {
  readonly label: string;
  readonly title: string;
};

/** Collapses `/architectures/new` and `/reviews/new` nav captions in Working mode. */
export function resolveWorkingSingleStartNavPresentation(
  href: string,
): WorkingSingleStartNavPresentation | null {
  if (!isWorkingSingleStartNavHref(href)) {
    return null;
  }

  return {
    label: WORKING_NEW_REVIEW_LABEL,
    title: WORKING_SINGLE_START_NAV_TOOLTIP,
  };
}

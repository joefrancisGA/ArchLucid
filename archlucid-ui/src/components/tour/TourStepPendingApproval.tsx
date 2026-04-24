import type { ReactNode } from "react";

/**
 * Visible "pending owner approval" wrapper for each step of the in-product opt-in
 * tour. The assistant drafts placeholder copy; until the owner reviews and approves
 * real wording (PENDING_QUESTIONS.md item 38, owner Q8 — 2026-04-23), every step
 * MUST render the marker so end-tenants cannot mistake draft copy for finalised
 * product wording.
 *
 * Removal protocol: when the owner approves a step's copy, swap this wrapper for a
 * plain `<>{children}</>` fragment in `OptInTour.tsx`. Do NOT add a prop to hide the
 * marker — that would let the marker silently disappear via config (which is exactly
 * what owner Q8 forbade).
 */
export const TOUR_PENDING_APPROVAL_MARKER = "<<tour copy — pending owner approval>>";

export interface TourStepPendingApprovalProps {
  readonly children: ReactNode;
}

export function TourStepPendingApproval({ children }: TourStepPendingApprovalProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">{children}</div>
      <p
        data-testid="tour-pending-approval-marker"
        className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-mono text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        role="note"
      >
        {TOUR_PENDING_APPROVAL_MARKER}
      </p>
    </div>
  );
}

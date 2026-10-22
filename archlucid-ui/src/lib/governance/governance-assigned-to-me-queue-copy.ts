import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";

/** Primary column header for the finding title in the operational queue table. */
export function governanceFindingsQueueRecordColumnLabel(
  mode: GovernanceFindingsQueueMode,
): string {
  return mode === "assigned-to-me" ? "Finding" : "Risk";
}

/** Primary row action CTA for opening a finding from the queue. */
export function governanceFindingsQueueViewRecordCta(mode: GovernanceFindingsQueueMode): string {
  return mode === "assigned-to-me" ? "View finding" : "View risk";
}

/** Accessible table name for the desktop queue region. */
export function governanceFindingsQueueTableAriaLabel(mode: GovernanceFindingsQueueMode): string {
  return mode === "assigned-to-me" ? "Assigned findings" : "Findings";
}

/** Keyboard navigation hint exposed to assistive technology (P0-GOF-6). */
export const GOVERNANCE_FINDINGS_QUEUE_KEYBOARD_HINT_AT =
  "Use J and K to move between rows, Enter to open the focused finding." as const;

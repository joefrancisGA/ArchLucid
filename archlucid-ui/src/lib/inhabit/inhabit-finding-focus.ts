import { focusAdjacentFindingCard } from "@/hooks/useFindingCardShortcuts";

/** IH-059 — focus first finding card on inhabited nested findings when cards exist. */
export function focusFirstInhabitedFindingCard(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  if (document.querySelector('[role="dialog"][data-state="open"]') !== null) {
    return false;
  }

  const firstCard = document.querySelector<HTMLElement>("[data-finding-id]");

  if (firstCard === null) {
    return false;
  }

  firstCard.focus();

  return true;
}

/** Skip link target id for keyboard users who prefer explicit control. */
export const INHABIT_FINDINGS_SKIP_TO_WORK_ID = "inhabit-findings-skip-to-work" as const;

export const INHABIT_FINDINGS_SKIP_TO_WORK_LABEL = "Skip to findings list" as const;

export function focusNextInhabitedFindingFromFirst(): void {
  focusAdjacentFindingCard(1);
}

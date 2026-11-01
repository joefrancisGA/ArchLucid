"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { useGovernanceFindingTriage } from "@/components/governance/findings/use-governance-finding-triage";
import { governanceQueueRowFindingIdEquals } from "@/lib/governance/governance-findings-queue-selection";
import {
  governanceFindingTriageFocusedFindingParamIsBlankToken,
  governanceFindingTriagePanelsHrefFromSearch,
  parseGovernanceFindingTriageFocusedFindingIdFromSearch,
} from "@/lib/governance/governance-finding-triage-panels-url";

function governanceFindingTriageActiveRowMatchesFocusedFinding(
  activeRow: GovernanceFindingQueueRow | null,
  focusedFindingId: string,
): boolean {
  return (
    activeRow !== null
    && governanceQueueRowFindingIdEquals(activeRow.findingId, focusedFindingId)
  );
}

/** Triage panel state with durable `focusedFinding` URL cursor for Working-mode queue navigation. */
export function useGovernanceFindingTriageWithCursor(
  displayedRows: readonly GovernanceFindingQueueRow[],
  searchParams: ReadonlyURLSearchParams,
) {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance/findings";
  const focusedFindingParam = searchParams.get("focusedFinding");
  const triage = useGovernanceFindingTriage(displayedRows);
  const { openForRow, activeRow, open, close } = triage;
  const urlCursorHydratingRef = useRef(
    parseGovernanceFindingTriageFocusedFindingIdFromSearch(focusedFindingParam).length > 0,
  );
  const triageWasOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (open) {
      triageWasOpenRef.current = true;

      return;
    }

    if (governanceFindingTriageFocusedFindingParamIsBlankToken(focusedFindingParam)) {
      if (open) {
        close();
      }

      router.replace(
        governanceFindingTriagePanelsHrefFromSearch(searchParams.toString(), null, pathname),
        { scroll: false },
      );

      return;
    }

    if (!triageWasOpenRef.current) {
      return;
    }

    const focusedFindingId = parseGovernanceFindingTriageFocusedFindingIdFromSearch(focusedFindingParam);

    if (focusedFindingId.length === 0) {
      return;
    }

    if (governanceFindingTriageActiveRowMatchesFocusedFinding(activeRow, focusedFindingId)) {
      router.replace(
        governanceFindingTriagePanelsHrefFromSearch(searchParams.toString(), null, pathname),
        { scroll: false },
      );
    }
  }, [activeRow, close, focusedFindingParam, open, pathname, router, searchParams]);

  useEffect(() => {
    const focusedFindingId = parseGovernanceFindingTriageFocusedFindingIdFromSearch(focusedFindingParam);

    if (focusedFindingId.length === 0) {
      return;
    }

    if (
      open
      && governanceFindingTriageActiveRowMatchesFocusedFinding(activeRow, focusedFindingId)
    ) {
      return;
    }

    if (
      !open
      && triageWasOpenRef.current
      && governanceFindingTriageActiveRowMatchesFocusedFinding(activeRow, focusedFindingId)
    ) {
      return;
    }

    const row = displayedRows.find(
      (candidate) =>
        candidate.recordKind === "finding"
        && governanceQueueRowFindingIdEquals(candidate.findingId, focusedFindingId),
    );

    if (row === undefined) {
      return;
    }

    openForRow(row);
  }, [activeRow, displayedRows, focusedFindingParam, open, openForRow]);

  useEffect(() => {
    if (governanceFindingTriageFocusedFindingParamIsBlankToken(focusedFindingParam)) {
      if (open) {
        close();
      }

      return;
    }

    if (urlCursorHydratingRef.current && !open) {
      return;
    }

    if (open) {
      urlCursorHydratingRef.current = false;
    }

    const focusedFindingIdFromUrl =
      parseGovernanceFindingTriageFocusedFindingIdFromSearch(focusedFindingParam);

    if (!open) {
      return;
    }

    if (
      focusedFindingIdFromUrl.length > 0
      && activeRow !== null
      && !governanceFindingTriageActiveRowMatchesFocusedFinding(activeRow, focusedFindingIdFromUrl)
    ) {
      return;
    }

    const nextFindingId = activeRow !== null ? activeRow.findingId : null;
    const normalizedNext = parseGovernanceFindingTriageFocusedFindingIdFromSearch(nextFindingId);
    const currentFindingId = focusedFindingIdFromUrl;

    if (currentFindingId === normalizedNext) {
      return;
    }

    router.replace(
      governanceFindingTriagePanelsHrefFromSearch(searchParams.toString(), nextFindingId, pathname),
      { scroll: false },
    );
  }, [activeRow?.findingId, focusedFindingParam, open, pathname, router, searchParams]);

  return triage;
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { useGovernanceFindingTriage } from "@/components/governance/findings/use-governance-finding-triage";
import {
  governanceFindingTriagePanelsHrefFromSearch,
  parseGovernanceFindingTriageFocusedFindingIdFromSearch,
} from "@/lib/governance/governance-finding-triage-panels-url";

/** Triage panel state with durable `focusedFinding` URL cursor for Working-mode queue navigation. */
export function useGovernanceFindingTriageWithCursor(
  displayedRows: readonly GovernanceFindingQueueRow[],
  searchParams: ReadonlyURLSearchParams,
) {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance/findings";
  const focusedFindingParam = searchParams.get("focusedFinding");
  const triage = useGovernanceFindingTriage(displayedRows);
  const { openForRow, activeRow, open } = triage;
  const hydratedFromUrlRef = useRef(false);

  useEffect(() => {
    if (hydratedFromUrlRef.current) {
      return;
    }

    const focusedFindingId = parseGovernanceFindingTriageFocusedFindingIdFromSearch(focusedFindingParam);

    if (focusedFindingId.length === 0) {
      hydratedFromUrlRef.current = true;

      return;
    }

    const row = displayedRows.find(
      (candidate) =>
        candidate.recordKind === "finding" && candidate.findingId === focusedFindingId,
    );

    if (row !== undefined) {
      openForRow(row);
    }

    hydratedFromUrlRef.current = true;
  }, [displayedRows, focusedFindingParam, openForRow]);

  useEffect(() => {
    const nextFindingId = open && activeRow !== null ? activeRow.findingId : null;
    const currentFindingId = parseGovernanceFindingTriageFocusedFindingIdFromSearch(focusedFindingParam);
    const normalizedNext = nextFindingId ?? "";

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

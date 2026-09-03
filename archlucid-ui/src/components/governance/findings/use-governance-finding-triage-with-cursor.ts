"use client";

import { useEffect, useRef } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { useGovernanceFindingTriage } from "@/components/governance/findings/use-governance-finding-triage";
import {
  readGovernanceQueueFocusedFindingId,
  writeGovernanceQueueFocusedFindingId,
} from "@/lib/governance/governance-findings-queue-selection";

/** Triage panel state with durable `focusedFinding` URL cursor for Working-mode queue navigation. */
export function useGovernanceFindingTriageWithCursor(
  displayedRows: readonly GovernanceFindingQueueRow[],
  searchParams: ReadonlyURLSearchParams,
) {
  const triage = useGovernanceFindingTriage(displayedRows);
  const { openForRow, activeRow, open } = triage;
  const hydratedFromUrlRef = useRef(false);

  useEffect(() => {
    if (hydratedFromUrlRef.current) {
      return;
    }

    const focusedFindingId = readGovernanceQueueFocusedFindingId(searchParams);

    if (focusedFindingId === null) {
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
  }, [displayedRows, openForRow, searchParams]);

  useEffect(() => {
    if (!open || activeRow === null) {
      writeGovernanceQueueFocusedFindingId(null);

      return;
    }

    writeGovernanceQueueFocusedFindingId(activeRow.findingId);
  }, [activeRow?.findingId, open]);

  return triage;
}

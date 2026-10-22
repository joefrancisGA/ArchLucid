"use client";

import { useCallback, useMemo, useState } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type GovernanceFindingTriageState = {
  readonly open: boolean;
  readonly activeIndex: number;
  readonly activeRow: GovernanceFindingQueueRow | null;
  readonly findingRows: readonly GovernanceFindingQueueRow[];
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly openAtIndex: (index: number) => void;
  readonly openForRow: (row: GovernanceFindingQueueRow) => void;
  readonly close: () => void;
  readonly goPrevious: () => void;
  readonly goNext: () => void;
  readonly setOpen: (open: boolean) => void;
};

/** Stay-in-list finding triage: side panel index state over displayed finding rows. */
export function useGovernanceFindingTriage(
  displayedRows: readonly GovernanceFindingQueueRow[],
): GovernanceFindingTriageState {
  const findingRows = useMemo(
    () => displayedRows.filter((row) => row.recordKind === "finding"),
    [displayedRows],
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeRow = findingRows[activeIndex] ?? null;
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < findingRows.length - 1;

  const openAtIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= findingRows.length) {
        return;
      }

      setActiveIndex(index);
      setOpen(true);
    },
    [findingRows.length],
  );

  const openForRow = useCallback(
    (row: GovernanceFindingQueueRow) => {
      const index = findingRows.findIndex(
        (candidate) => candidate.runId === row.runId && candidate.findingId === row.findingId,
      );

      if (index < 0) {
        return;
      }

      openAtIndex(index);
    },
    [findingRows, openAtIndex],
  );

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const goPrevious = useCallback(() => {
    if (!canGoPrevious) {
      return;
    }

    setActiveIndex((current) => Math.max(0, current - 1));
  }, [canGoPrevious]);

  const goNext = useCallback(() => {
    if (!canGoNext) {
      return;
    }

    setActiveIndex((current) => Math.min(findingRows.length - 1, current + 1));
  }, [canGoNext, findingRows.length]);

  return {
    open,
    activeIndex,
    activeRow,
    findingRows,
    canGoPrevious,
    canGoNext,
    openAtIndex,
    openForRow,
    close,
    goPrevious,
    goNext,
    setOpen,
  };
}

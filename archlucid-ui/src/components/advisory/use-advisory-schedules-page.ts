"use client";

import { useRef } from "react";

import { useAdvisorySchedulesPageCreate } from "@/components/advisory/use-advisory-schedules-page-create";
import { useAdvisorySchedulesPageList } from "@/components/advisory/use-advisory-schedules-page-list";
import { useAdvisorySchedulesPageRunHistory } from "@/components/advisory/use-advisory-schedules-page-run-history";

export type AdvisorySchedulesPageState = ReturnType<typeof useAdvisorySchedulesPage>;

export function useAdvisorySchedulesPage(initialRunId?: string | null) {
  const scopeResetRef = useRef<() => void>(() => {});
  const list = useAdvisorySchedulesPageList({
    initialRunId,
    onOperatorScopeChanged: () => {
      scopeResetRef.current();
    },
  });
  const create = useAdvisorySchedulesPageCreate({ list });
  const runHistory = useAdvisorySchedulesPageRunHistory({ list });
  scopeResetRef.current = runHistory.resetHistoryOnScopeChange;

  return {
    ...list,
    ...create,
    ...runHistory,
  };
}

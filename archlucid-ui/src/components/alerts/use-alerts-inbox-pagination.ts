"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { AlertsInboxPageModel } from "@/app/(operator)/governance/alerts/_sections/alerts-inbox-page-model";
import {
  alertsInboxStatusHrefFromSearch,
  parseAlertsInboxStatusFromSearch,
} from "@/lib/governance/alerts-inbox-status-url";

/** Cursor stack: index 0 is always `""` (first page). Later entries are prior `nextCursor` values. */
function initialCursorStack(initialModel: AlertsInboxPageModel | null): string[] {
  const cursor = initialModel?.cursor ?? "";

  if (cursor.length === 0) {
    return [""];
  }

  return ["", cursor];
}

export function useAlertsInboxPagination(initialModel: AlertsInboxPageModel | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStatus = parseAlertsInboxStatusFromSearch(searchParams.get("status"));
  const [status, setStatus] = useState<string>(initialModel?.status ?? urlStatus);
  const [cursorStack, setCursorStack] = useState<string[]>(() => initialCursorStack(initialModel));

  useEffect(() => {
    if (status === urlStatus) {
      return;
    }

    setStatus(urlStatus);
    setCursorStack([""]);
  }, [status, urlStatus]);

  const cursor = cursorStack[cursorStack.length - 1] ?? "";
  const page = cursorStack.length;
  const canGoPrevious = cursorStack.length > 1;

  const changeStatusFilter = useCallback(
    (value: string): void => {
      setStatus(value);
      setCursorStack([""]);
      router.replace(alertsInboxStatusHrefFromSearch(searchParams.toString(), value), { scroll: false });
    },
    [router, searchParams],
  );

  function goNextPage(nextCursor: string): void {
    setCursorStack((prev) => [...prev, nextCursor]);
  }

  function goPreviousPage(): void {
    setCursorStack((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      return prev.slice(0, -1);
    });
  }

  const resetCursorStack = useCallback((): void => {
    setCursorStack([""]);
  }, []);

  return {
    status,
    cursor,
    page,
    canGoPrevious,
    changeStatusFilter,
    goNextPage,
    goPreviousPage,
    resetCursorStack,
  };
}

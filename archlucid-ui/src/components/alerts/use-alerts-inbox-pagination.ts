"use client";

import { useState } from "react";

import type { AlertsInboxPageModel } from "@/app/(operator)/governance/alerts/_sections/alerts-inbox-page-model";

/** Cursor stack: index 0 is always `""` (first page). Later entries are prior `nextCursor` values. */
function initialCursorStack(initialModel: AlertsInboxPageModel | null): string[] {
  const cursor = initialModel?.cursor ?? "";

  if (cursor.length === 0) {
    return [""];
  }

  return ["", cursor];
}

export function useAlertsInboxPagination(initialModel: AlertsInboxPageModel | null) {
  const [status, setStatus] = useState<string>(initialModel?.status ?? "Open");
  const [cursorStack, setCursorStack] = useState<string[]>(() => initialCursorStack(initialModel));

  const cursor = cursorStack[cursorStack.length - 1] ?? "";
  const page = cursorStack.length;
  const canGoPrevious = cursorStack.length > 1;

  function changeStatusFilter(value: string): void {
    setStatus(value);
    setCursorStack([""]);
  }

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

  return {
    status,
    cursor,
    page,
    canGoPrevious,
    changeStatusFilter,
    goNextPage,
    goPreviousPage,
  };
}

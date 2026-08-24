"use client";

import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_audit_save_view_coach_dismissed_v1";

export type AuditSaveViewCoachProps = {
  readonly filtersActive: boolean;
  readonly showSavedViews: boolean;
};

/** One-time coach pointing operators at Save view when audit filters are in use. */
export function AuditSaveViewCoach(props: AuditSaveViewCoachProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!props.filtersActive || !props.showSavedViews) {
      setVisible(false);

      return;
    }

    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, [props.filtersActive, props.showSavedViews]);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="audit-save-view-coach"
      role="note"
    >
      <p className="m-0 min-w-0 flex-1 text-neutral-800 dark:text-neutral-200">
        Filters are active — use{" "}
        <strong data-testid="audit-save-view-coach-target">Save view</strong> below to name this filter set for repeat
        investigations.
      </p>
      <DismissControl className="h-7" onDismiss={onDismiss} />
    </div>
  );
}

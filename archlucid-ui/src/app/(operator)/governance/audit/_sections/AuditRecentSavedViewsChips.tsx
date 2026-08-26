"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import { useOperatorSavedViews } from "@/components/operator/OperatorSavedViewsBar";
import {
  clearAuditRecentSavedViews,
  readAuditRecentSavedViews,
  recordAuditRecentSavedView,
  type AuditRecentSavedViewEntry,
} from "@/lib/audit-recent-saved-views";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AuditRecentSavedViewsChipsProps = {
  readonly onLoadView: (view: OperatorSavedView) => void | Promise<void>;
};

/** Recent audit saved-view chips (max 3) for quick recall. */
export function AuditRecentSavedViewsChips(props: AuditRecentSavedViewsChipsProps): React.JSX.Element | null {
  const savedViewsState = useOperatorSavedViews({ surface: "audit" });
  const savedViews = savedViewsState.views;
  const [recentViews, setRecentViews] = useState<readonly AuditRecentSavedViewEntry[]>([]);

  useEffect(() => {
    setRecentViews(readAuditRecentSavedViews());
  }, []);

  const loadRecentView = useCallback(
    (entry: AuditRecentSavedViewEntry) => {
      const view = savedViews.find((candidate) => candidate.id === entry.viewId);

      if (view === undefined) {
        return;
      }

      recordAuditRecentSavedView({ viewId: view.id, name: view.name });
      setRecentViews(readAuditRecentSavedViews());
      void props.onLoadView(view);
    },
    [props.onLoadView, savedViews],
  );

  if (recentViews.length === 0) {
    return null;
  }

  return (
    <div className="mb-3" data-testid="audit-recent-saved-views">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Recent saved views</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="audit-recent-saved-views-clear"
          onClick={() => {
            clearAuditRecentSavedViews();
            setRecentViews([]);
          }}
        >
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentViews.map((entry) => (
          <Button
            key={entry.viewId}
            type="button"
            variant="outline"
            size="sm"
            data-testid={`audit-recent-saved-view-${entry.viewId}`}
            onClick={() => {
              loadRecentView(entry);
            }}
          >
            {entry.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function wrapAuditSavedViewLoad(
  onLoadView: (view: OperatorSavedView) => void | Promise<void>,
): (view: OperatorSavedView) => void | Promise<void> {
  return (view) => {
    recordAuditRecentSavedView({ viewId: view.id, name: view.name });
    return onLoadView(view);
  };
}

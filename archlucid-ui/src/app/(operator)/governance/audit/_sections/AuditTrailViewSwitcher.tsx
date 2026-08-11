"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AUDIT_TRAIL_VIEW_STORY_LABEL,
  AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL,
  AUDIT_TRAIL_VIEW_TABLE_LABEL,
  type AuditTrailViewMode,
} from "@/lib/audit-trail-view-mode";

type AuditTrailViewSwitcherProps = {
  readonly viewMode: AuditTrailViewMode;
  readonly onViewModeChange: (mode: AuditTrailViewMode) => void;
};

export function AuditTrailViewSwitcher(props: AuditTrailViewSwitcherProps): React.JSX.Element {
  const tabs: ReadonlyArray<{ readonly id: AuditTrailViewMode; readonly label: string }> = [
    { id: "story", label: AUDIT_TRAIL_VIEW_STORY_LABEL },
    { id: "table", label: AUDIT_TRAIL_VIEW_TABLE_LABEL },
  ];

  return (
    <div
      className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="audit-trail-view-switcher"
      role="group"
      aria-label={AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL}
    >
      {tabs.map((tab) => {
        const active = props.viewMode === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            data-testid={`audit-trail-view-${tab.id}`}
            className={cn(
              "rounded px-3 py-1.5 transition-colors",
              OPERATOR_TYPOGRAPHY.body,
              "font-medium",
              active
                ? "bg-white text-al-text-primary shadow-sm dark:bg-neutral-950"
                : "bg-transparent text-al-text-secondary hover:text-al-text-primary",
            )}
            onClick={() => {
              props.onViewModeChange(tab.id);
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  AUDIT_TRAIL_VIEW_STORY_LABEL,
  AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL,
  AUDIT_TRAIL_VIEW_TABLE_LABEL,
  type AuditTrailViewMode,
} from "@/lib/audit-trail-view-mode";
import { auditTrailViewModeHrefFromSearch } from "@/lib/governance/audit-trail-view-url";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

type AuditTrailViewSwitcherProps = {
  readonly viewMode: AuditTrailViewMode;
  readonly currentSearch: string;
};

export function AuditTrailViewSwitcher(props: AuditTrailViewSwitcherProps): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const tabs: ReadonlyArray<{ readonly id: AuditTrailViewMode; readonly label: string }> = [
    { id: "story", label: AUDIT_TRAIL_VIEW_STORY_LABEL },
    { id: "table", label: AUDIT_TRAIL_VIEW_TABLE_LABEL },
  ];

  return (
    <FilterChipGroup
      aria-label={AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL}
      className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="audit-trail-view-switcher"
    >
      {tabs.map((tab) => (
        <FilterChip
          key={tab.id}
          href={auditTrailViewModeHrefFromSearch(
            props.currentSearch,
            tab.id,
            buyerPolishedShell,
            GOVERNANCE_AUDIT_PATH,
          )}
          scroll={false}
          className={buyerFilterChipClass(props.viewMode === tab.id, false)}
          aria-current={props.viewMode === tab.id ? "page" : undefined}
          data-testid={`audit-trail-view-${tab.id}`}
        >
          {tab.label}
        </FilterChip>
      ))}
    </FilterChipGroup>
  );
}

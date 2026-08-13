"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALERTS_INBOX_ALL_STATUSES_VALUE,
} from "@/app/(operator)/governance/alerts/_sections/load-alerts-inbox-page-model";
import { ALERTS_INBOX_LABELS } from "@/lib/i18n";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NOT_REFRESHED_LABEL } from "@/lib/operator/operator-last-refreshed-label";
import { formatRelativeTime } from "@/lib/relative-time";

export type AlertsInboxControlsProps = {
  readonly status: string;
  readonly page: number;
  readonly loading: boolean;
  readonly buyerPolishedShell: boolean;
  readonly canMutateAlertInbox: boolean;
  readonly visibleAlertCount: number;
  readonly selectedAlertCount: number;
  readonly batchAckBusy: boolean;
  readonly allVisibleSelected: boolean;
  readonly pageMixSummary: string | null;
  readonly hasLoadFailure: boolean;
  readonly lastRefreshedUtc: string | null;
  /** When false and workspace context has settled, hide filter/refresh/batch (TB-2105). */
  readonly hasAlertRules: boolean;
  readonly workspaceContextLoading: boolean;
  readonly onStatusChange: (value: string) => void;
  readonly onRefresh: () => void;
  readonly onAcknowledgeSelected: () => void;
  readonly onToggleSelectAllVisible: (checked: boolean) => void;
};

function formatLastUpdatedLabel(lastRefreshedUtc: string | null, loading: boolean): string {
  if (loading && lastRefreshedUtc === null) {
    return "Updating…";
  }

  if (lastRefreshedUtc === null) {
    return OPERATOR_NOT_REFRESHED_LABEL;
  }

  return `Updated ${formatRelativeTime(lastRefreshedUtc)}`;
}

/** True when Status/Refresh/batch controls should render (hidden for settled no_rules — TB-2105). */
export function shouldShowAlertsInboxControls(
  hasAlertRules: boolean,
  workspaceContextLoading: boolean,
): boolean {
  if (workspaceContextLoading) {
    return true;
  }

  return hasAlertRules;
}

export function AlertsInboxControls(props: AlertsInboxControlsProps) {
  if (!shouldShowAlertsInboxControls(props.hasAlertRules, props.workspaceContextLoading)) {
    return null;
  }

  return (
    <>
      <div
        className="mb-3 flex flex-wrap items-end justify-between gap-3"
        data-testid="alerts-inbox-controls"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-2">
            <Label htmlFor="alerts-status-filter">Status</Label>
            <Select value={props.status} onValueChange={props.onStatusChange}>
              <SelectTrigger id="alerts-status-filter" className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALERTS_INBOX_ALL_STATUSES_VALUE}>All</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Suppressed">Suppressed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <RefreshButton busy={props.loading} size="default" onClick={props.onRefresh} />
          {props.canMutateAlertInbox && props.visibleAlertCount > 0 ? (
            <Button
              type="button"
              variant="primary"
              disabled={props.batchAckBusy || props.selectedAlertCount === 0}
              data-testid="alerts-acknowledge-selected"
              onClick={props.onAcknowledgeSelected}
            >
              {props.batchAckBusy
                ? ALERTS_INBOX_LABELS.acknowledgingSelected
                : `${ALERTS_INBOX_LABELS.acknowledgeSelected}${props.selectedAlertCount > 0 ? ` (${props.selectedAlertCount})` : ""}`}
            </Button>
          ) : null}
        </div>

        {!props.hasLoadFailure ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="alerts-inbox-last-updated"
            aria-live="polite"
          >
            {formatLastUpdatedLabel(props.lastRefreshedUtc, props.loading)}
          </p>
        ) : null}
      </div>

      {props.pageMixSummary !== null && props.status === ALERTS_INBOX_ALL_STATUSES_VALUE && !props.hasLoadFailure ? (
        <p className={cn("m-0 mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid="alerts-inbox-page-mix">
          Page {props.page}: {props.pageMixSummary}.
        </p>
      ) : null}

      {props.buyerPolishedShell ? null : (
        <span className="sr-only">
          {props.canMutateAlertInbox
            ? "Keyboard shortcuts: Alt+J and Alt+K move between alert cards; Alt+1 acknowledge; Alt+2 resolve; Alt+3 opens suppress from More triage actions."
            : "Keyboard shortcuts: Alt+J and Alt+K move between alert cards; triage shortcuts apply only at Execute rank."}
        </span>
      )}

      {props.canMutateAlertInbox && props.visibleAlertCount > 0 ? (
        <div className={cn("mb-3 flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)} data-testid="alerts-inbox-bulk-select">
          <input
            id="alerts-select-all-visible"
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600 dark:border-neutral-600"
            checked={props.allVisibleSelected}
            aria-label={ALERTS_INBOX_LABELS.selectAllOnPage}
            onChange={(e) => {
              props.onToggleSelectAllVisible(e.target.checked);
            }}
          />
          <Label htmlFor="alerts-select-all-visible" className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {ALERTS_INBOX_LABELS.selectAllOnPage}
          </Label>
        </div>
      ) : null}
    </>
  );
}

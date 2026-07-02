import Link from "next/link";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
} from "@/app/(operator)/alerts/_sections/load-alerts-inbox-page-model";
import {
  alertsInboxRefreshButtonTitleOperator,
  alertsInboxRefreshButtonTitleReader,
} from "@/lib/enterprise-controls-context-copy";
import { ALERTS_INBOX_LABELS } from "@/lib/i18n";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AlertsInboxControlsProps = {
  readonly status: string;
  readonly page: number;
  readonly totalPages: number;
  readonly totalCount: number;
  readonly loading: boolean;
  readonly buyerPolishedShell: boolean;
  readonly canMutateAlertInbox: boolean;
  readonly visibleAlertCount: number;
  readonly selectedAlertCount: number;
  readonly batchAckBusy: boolean;
  readonly allVisibleSelected: boolean;
  readonly pageMixSummary: string | null;
  readonly hasLoadFailure: boolean;
  readonly onStatusChange: (value: string) => void;
  readonly onRefresh: () => void;
  readonly onAcknowledgeSelected: () => void;
  readonly onToggleSelectAllVisible: (checked: boolean) => void;
};

export function AlertsInboxControls(props: AlertsInboxControlsProps) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="alerts-status-filter">Status filter</Label>
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
        <Button
          type="button"
          variant="secondary"
          onClick={props.onRefresh}
          disabled={props.loading}
          title={
            props.canMutateAlertInbox ? alertsInboxRefreshButtonTitleOperator : alertsInboxRefreshButtonTitleReader
          }
        >
          {props.loading ? "Loading…" : "Refresh"}
        </Button>
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
        <div
          className={cn(
            "mb-4 max-w-prose rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="alerts-inbox-operational-summary"
        >
          {props.loading ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">Refreshing alert counts…</p>
          ) : (
            <>
              <p className="m-0">
                <strong>{props.totalCount}</strong> {props.totalCount === 1 ? "alert" : "alerts"}{" "}
                {props.status === ALERTS_INBOX_ALL_STATUSES_VALUE ? "for the current filter." : `with status “${props.status}”.`}
              </p>
              {props.pageMixSummary !== null && props.status === ALERTS_INBOX_ALL_STATUSES_VALUE ? (
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Page {props.page} of {props.totalPages}: {props.pageMixSummary}.
                </p>
              ) : null}
              {props.totalCount === 0 && !props.buyerPolishedShell ? (
                <p className="m-0 mt-1">
                  <Link className={cn("font-medium", OPERATOR_LINK.nav)} href="/alerts?tab=rules">
                    Configure alert rules
                  </Link>{" "}
                  when you expect traffic.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {props.buyerPolishedShell ? null : (
        <span className="sr-only">
          {props.canMutateAlertInbox
            ? "Keyboard shortcuts: Alt+J and Alt+K move between alert cards; Alt+1 acknowledge; Alt+2 resolve; Alt+3 opens suppress from More triage actions."
            : "Keyboard shortcuts: Alt+J and Alt+K move between alert cards; triage shortcuts apply only at Execute rank."}
        </span>
      )}

      {props.canMutateAlertInbox && props.visibleAlertCount > 0 ? (
        <div className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)} data-testid="alerts-inbox-bulk-select">
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

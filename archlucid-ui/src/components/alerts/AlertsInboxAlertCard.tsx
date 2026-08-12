import Link from "next/link";
import { cn } from "@/lib/utils";

import { alertsInboxSeverityBadgeClass } from "@/components/alerts/alerts-inbox-severity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  alertsTriageAcknowledgeButtonLabelReaderInbox,
  alertsTriageOpenPreviewReaderTitle,
  alertsTriageResolveButtonLabelReaderInbox,
  alertsTriageSuppressButtonLabelReaderInbox,
} from "@/lib/enterprise-controls-context-copy";
import { alertPrimaryFindingDetailHref } from "@/lib/alert-finding-navigation";
import { getCanonicalReviewWorkspaceHref } from "@/lib/buyer-safe-review-navigation";
import { ALERTS_INBOX_LABELS } from "@/lib/i18n";
import { policyPacksRuleHref } from "@/lib/policy/policy-packs-deep-link";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import type { AlertRecord } from "@/types/alerts";

export type AlertActionKind = "Acknowledge" | "Resolve" | "Suppress";

export type AlertsInboxAlertCardProps = {
  readonly alert: AlertRecord;
  readonly buyerPolishedShell: boolean;
  readonly canMutateAlertInbox: boolean;
  readonly selected: boolean;
  readonly archiveBusyAlertId: string | null;
  readonly onToggleSelected: (alertId: string, checked: boolean) => void;
  readonly onPendingAction: (alertId: string, action: AlertActionKind) => void;
  readonly onArchiveAlert: (alertId: string) => void;
  readonly onOpenRoutingDelivery: (alertId: string, findingDetailHref: string | null) => void;
};

export function AlertsInboxAlertCard(props: AlertsInboxAlertCardProps) {
  const findingDetailHref = alertPrimaryFindingDetailHref(props.alert);
  const reviewPackageHref =
    props.alert.runId !== null && props.alert.runId !== undefined && props.alert.runId.trim().length > 0
      ? getCanonicalReviewWorkspaceHref(props.alert.runId)
      : null;
  const lastUpdatedLabel =
    props.alert.lastUpdatedUtc !== null
    && props.alert.lastUpdatedUtc !== undefined
    && props.alert.lastUpdatedUtc.trim().length > 0
      ? formatRelativeTime(props.alert.lastUpdatedUtc)
      : formatRelativeTime(props.alert.createdUtc);
  const hideDemoTriageActions = props.buyerPolishedShell && props.alert.alertId === "demo-alert-phi-intake";

  return (
    <article
      role="article"
      tabIndex={0}
      data-alert-id={props.alert.alertId}
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div>
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {props.canMutateAlertInbox ? (
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-teal-700 focus:ring-teal-600 dark:border-neutral-600"
                checked={props.selected}
                aria-label={ALERTS_INBOX_LABELS.selectAlert}
                data-testid={`alert-select-${props.alert.alertId}`}
                onChange={(e) => {
                  props.onToggleSelected(props.alert.alertId, e.target.checked);
                }}
              />
            ) : null}
            <strong className={cn("min-w-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {props.alert.title}
            </strong>
          </div>
          <Badge
            className={cn("font-semibold", OPERATOR_TYPOGRAPHY.badge, alertsInboxSeverityBadgeClass(props.alert.severity))}
            variant="outline"
          >
            {props.alert.severity}
          </Badge>
        </div>
        <div className={cn("mb-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <span className="text-neutral-500 dark:text-neutral-500">Category:</span> {props.alert.category}
        </div>
        <div className={cn("mb-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <span className="text-neutral-500 dark:text-neutral-500">Status:</span> {props.alert.status}
        </div>
        <div className={cn("mb-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <span className="text-neutral-500 dark:text-neutral-500">Rule:</span>{" "}
          {props.alert.ruleId.trim().length > 0 ? (
            <Link href={policyPacksRuleHref(props.alert.ruleId)} className={cn(OPERATOR_LINK.inline, "font-medium")}>
              {props.alert.ruleId}
            </Link>
          ) : (
            "—"
          )}
        </div>
        {reviewPackageHref !== null ? (
          <div className={cn("mb-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            <span className="text-neutral-500 dark:text-neutral-500">Review:</span>{" "}
            <Link href={reviewPackageHref} className={cn(OPERATOR_LINK.inline, "font-medium")}>
              Open review
            </Link>
          </div>
        ) : null}
        <div className={cn("mb-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <span className="text-neutral-500 dark:text-neutral-500">Last updated:</span> {lastUpdatedLabel}
        </div>
        <div className={cn("mb-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <span className="text-neutral-500 dark:text-neutral-500">Trigger:</span> {props.alert.triggerValue}
        </div>
        <p className={cn("leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {props.alert.description}
        </p>
        {findingDetailHref !== null ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="default" size="sm" className="h-9">
              <Link href={findingDetailHref}>Open finding</Link>
            </Button>
          </div>
        ) : null}
        <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              props.onOpenRoutingDelivery(props.alert.alertId, findingDetailHref);
            }}
          >
            Routing &amp; delivery
          </Button>
        </div>
      </div>

      {hideDemoTriageActions ? (
        <section
          className={cn(
            "mt-4 border-t border-neutral-200 pt-3 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400",
            OPERATOR_TYPOGRAPHY.body,
          )}
          aria-label="Sample alert"
        >
          Triage, suppress, and routing rules stay available in live tenants — not exercised in this read-only sample.
        </section>
      ) : (
        <section
          className={cn(
            "mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700",
            !props.canMutateAlertInbox && "opacity-90",
          )}
          aria-label="Triage actions"
        >
          <h3 className={cn(OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>Triage actions</h3>
          {props.canMutateAlertInbox ? (
            <p className={cn("mt-1.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Use triage actions when this signal needs follow-up.
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={props.canMutateAlertInbox ? "secondary" : "outline"}
              title={props.canMutateAlertInbox ? undefined : alertsTriageOpenPreviewReaderTitle}
              onClick={() => {
                props.onPendingAction(props.alert.alertId, "Acknowledge");
              }}
            >
              {props.canMutateAlertInbox ? "Acknowledge" : alertsTriageAcknowledgeButtonLabelReaderInbox}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={props.canMutateAlertInbox ? "secondary" : "outline"}
              title={props.canMutateAlertInbox ? undefined : alertsTriageOpenPreviewReaderTitle}
              onClick={() => {
                props.onPendingAction(props.alert.alertId, "Resolve");
              }}
            >
              {props.canMutateAlertInbox ? "Resolve" : alertsTriageResolveButtonLabelReaderInbox}
            </Button>
            {props.canMutateAlertInbox ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={props.archiveBusyAlertId === props.alert.alertId}
                data-testid={`alert-archive-${props.alert.alertId}`}
                onClick={() => {
                  props.onArchiveAlert(props.alert.alertId);
                }}
              >
                {props.archiveBusyAlertId === props.alert.alertId
                  ? ALERTS_INBOX_LABELS.archivingAlert
                  : ALERTS_INBOX_LABELS.archiveAlert}
              </Button>
            ) : null}
            {props.buyerPolishedShell ? null : (
              <details className="group relative">
                <summary
                  className={cn(
                    "cursor-pointer list-none rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 [&::-webkit-details-marker]:hidden",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                >
                  More triage actions
                </summary>
                <div className="absolute end-0 z-20 mt-1 min-w-[11rem] rounded-md border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-700 dark:bg-neutral-950">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full border-rose-600/40 text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-rose-800/50"
                    title={props.canMutateAlertInbox ? undefined : alertsTriageOpenPreviewReaderTitle}
                    onClick={() => {
                      props.onPendingAction(props.alert.alertId, "Suppress");
                    }}
                  >
                    {props.canMutateAlertInbox ? "Suppress alert…" : alertsTriageSuppressButtonLabelReaderInbox}
                  </Button>
                </div>
              </details>
            )}
          </div>
        </section>
      )}
    </article>
  );
}

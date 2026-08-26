"use client";

import Link from "next/link";
import { type ReactElement } from "react";

import { OperatorFormSummaryRow } from "@/components/advisory/OperatorFormSummaryRow";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { formatDigestInstant } from "@/lib/digest-setup-gap-actions";
import {
  DIGESTS_SCHEDULE_GENERATE_TEST_LABEL,
  DIGESTS_SCHEDULE_PREVIEW_LABEL,
} from "@/lib/digests-browse-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  type ExecDigestScheduleFormState,
} from "@/lib/exec-digest-schedule-form";
import {
  buildExecDigestRecipientSummary,
  EXEC_DIGEST_PREVIEW_HELPER,
  EXEC_DIGEST_PREVIEW_UNAVAILABLE,
  EXEC_DIGEST_TEST_GENERATION_HELPER,
  formatExecDigestNextSendLabel,
  type ExecDigestDeliveryReadinessModel,
  type ExecDigestSavedScheduleSummary,
  type ExecDigestStatusPresentation,
} from "@/lib/exec-digest-schedule-page-model";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";
import { cn } from "@/lib/utils";

export type ExecDigestSchedulePreviewPanelProps = {
  readonly variant: "delivery-readiness" | "latest-generated" | "saved-summary";
  readonly sampleModeBlocked: boolean;
  readonly form: ExecDigestScheduleFormState;
  readonly prefs: ExecDigestPreferencesResponse;
  readonly status: ExecDigestStatusPresentation | null;
  readonly readiness: ExecDigestDeliveryReadinessModel | null;
  readonly savedSummary: ExecDigestSavedScheduleSummary | null;
  readonly recipientCount: number;
  readonly subscriptionDestinationCount: number;
  readonly liveScheduleSummary: string | null;
  readonly pinLivePreviewRail: boolean;
  readonly hasPreviewDigest: boolean;
  readonly previewHref: string;
  readonly healthSnap: WeeklyDigestHealthDto | null | undefined;
  readonly onRefresh: (() => void) | undefined;
  readonly refreshing: boolean;
};

export function ExecDigestSchedulePreviewPanel(props: ExecDigestSchedulePreviewPanelProps): ReactElement | null {
  if (props.variant === "delivery-readiness") {
    return (
      <section
        className={cn(
          "rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950",
          props.pinLivePreviewRail ? "p-4" : "p-3",
        )}
        data-testid="exec-digest-delivery-readiness"
        aria-labelledby="exec-digest-delivery-readiness-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3
            id="exec-digest-delivery-readiness-heading"
            className={cn(
              "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
              OPERATOR_TYPOGRAPHY.cardTitle,
            )}
          >
            Delivery readiness
          </h3>
          {props.readiness !== null ? (
            <StatusTag
              kind={props.readiness.overallStatusTagKind}
              label={props.readiness.overallLabel}
              data-testid="exec-digest-status-tag"
            />
          ) : null}
        </div>
        {props.status !== null ? (
          <p
            className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
            role="status"
          >
            {props.status.summary}
          </p>
        ) : null}
        <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2" data-testid="exec-digest-status-summary">
          <OperatorFormSummaryRow label="Configured schedule" value={props.liveScheduleSummary ?? " — "} />
          <OperatorFormSummaryRow
            label="Next send"
            value={formatExecDigestNextSendLabel(props.form, props.prefs.isConfigured)}
          />
          <OperatorFormSummaryRow
            label="Recipients"
            value={
              props.sampleModeBlocked
                ? `${props.recipientCount} direct`
                : buildExecDigestRecipientSummary(props.recipientCount, props.subscriptionDestinationCount)
            }
          />
        </dl>
        {props.readiness?.nextAction !== null && props.readiness !== null ? (
          <p
            className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
            data-testid="exec-digest-readiness-next-action"
          >
            {props.readiness.nextAction}
          </p>
        ) : null}
        <ul className="m-0 mt-3 list-none space-y-3 p-0">
          {props.readiness?.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {item.label}
                </p>
                <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {item.value}
                </p>
              </div>
              {item.actionHref !== undefined && item.actionLabel !== undefined ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={item.actionHref}>{item.actionLabel}</Link>
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {props.onRefresh !== undefined ? (
          <RefreshButton
            busy={props.refreshing}
            label="Refresh status"
            className="mt-4"
            data-testid="exec-digest-refresh-status"
            onClick={props.onRefresh}
          />
        ) : null}
      </section>
    );
  }

  if (props.variant === "latest-generated") {
    return (
      <section
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
        data-testid="exec-digest-latest-generated"
      >
        <h3
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.cardTitle,
          )}
        >
          Latest architecture digest
        </h3>
        {props.hasPreviewDigest ? (
          <>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Generated {formatDigestInstant(props.healthSnap?.latestArchitectureDigestGeneratedUtc)}
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3" data-testid="exec-digest-preview-action">
              <Link href={props.previewHref}>{DIGESTS_SCHEDULE_PREVIEW_LABEL}</Link>
            </Button>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {EXEC_DIGEST_PREVIEW_HELPER}
            </p>
          </>
        ) : (
          <>
            <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              No digest has been generated yet.
            </p>
            <p
              id="exec-digest-preview-unavailable-hint"
              className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            >
              {EXEC_DIGEST_PREVIEW_UNAVAILABLE}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              disabled
              data-testid="exec-digest-preview-action"
              aria-describedby="exec-digest-preview-unavailable-hint"
            >
              {DIGESTS_SCHEDULE_PREVIEW_LABEL}
            </Button>
          </>
        )}

        {!props.sampleModeBlocked ? (
          <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <Button asChild size="sm" variant="outline" data-testid="exec-digest-test-action">
              <Link href={ADVISORY_SCANS_SCHEDULES_HREF} title={EXEC_DIGEST_TEST_GENERATION_HELPER}>
                {DIGESTS_SCHEDULE_GENERATE_TEST_LABEL}
              </Link>
            </Button>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {EXEC_DIGEST_TEST_GENERATION_HELPER}
            </p>
          </div>
        ) : (
          <p
            className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="exec-digest-test-sample-blocked"
          >
            Test generation and email delivery are unavailable in the sample workspace.
          </p>
        )}
      </section>
    );
  }

  if (props.variant === "saved-summary" && props.savedSummary !== null && props.prefs.isConfigured) {
    return (
      <section
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
        data-testid="exec-digest-saved-summary"
      >
        <h3
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.cardTitle,
          )}
        >
          Saved schedule
        </h3>
        <dl className="m-0 mt-3 grid gap-3">
          <OperatorFormSummaryRow label="Delivery status" value={props.savedSummary.deliveryStatus} />
          <OperatorFormSummaryRow label="Configured schedule" value={props.savedSummary.configuredCadence} />
          <OperatorFormSummaryRow label="Time zone" value={props.savedSummary.timeZone} />
          <OperatorFormSummaryRow label="Next send" value={props.savedSummary.nextScheduledSend} />
          <OperatorFormSummaryRow label="Direct recipients" value={String(props.savedSummary.directRecipientCount)} />
          <OperatorFormSummaryRow
            label="Subscription destinations"
            value={String(props.savedSummary.subscriptionDestinationCount)}
          />
          <OperatorFormSummaryRow label="Last schedule update" value={props.savedSummary.lastScheduleUpdate} />
        </dl>
      </section>
    );
  }

  return null;
}

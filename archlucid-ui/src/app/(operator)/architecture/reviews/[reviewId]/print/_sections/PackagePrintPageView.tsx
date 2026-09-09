"use client";

import Link from "next/link";

import { DocumentLayout } from "@/components/DocumentLayout";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PackagePrintButton } from "@/components/reviews/PackagePrintButton";
import { StatusTag } from "@/components/ui/status-tag";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { useWorkingBackLocator } from "@/hooks/use-working-back-locator";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  resolvePackagePrintInspectEmphasizedStepId,
  resolvePackagePrintInspectSteps,
} from "@/lib/package-print-inspect-checklist";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import {
  PACKAGE_PRINT_FIRST_VIEWPORT_ID,
  PACKAGE_PRINT_PAGE_SUBTITLE_BUYER,
  PACKAGE_PRINT_PRIMARY_CONTENT_ID,
  PACKAGE_PRINT_SKIP_LINK_LABEL,
  PACKAGE_PRINT_SKIP_TARGET_ID,
} from "@/lib/package-print-page-copy";
import {
  PACKAGE_PRINT_MEETING_CAPTURE_HEADING,
  PACKAGE_PRINT_MEETING_CAPTURE_SECTION_ID,
  REVIEW_MEETING_CAPTURE_DISCLAIMER,
  hasReviewMeetingCapture,
} from "@/lib/reviews/review-meeting-capture-export";
import {
  PACKAGE_PRINT_BACK_LABEL,
  PACKAGE_PRINT_FINDINGS_HEADING,
  PACKAGE_PRINT_INSTRUCTIONS,
  PACKAGE_PRINT_META_CREATED_LABEL,
  PACKAGE_PRINT_PAGE_TITLE,
  PACKAGE_PRINT_STATUS_HEADING,
  PACKAGE_PRINT_SYNOPSIS_HEADING,
  PACKAGE_PRINT_COVERAGE_HONESTY_LINE,
  buildPackagePrintPath,
  type PackagePrintPresentation,
} from "@/lib/package-print-view";
import { cn } from "@/lib/utils";

import { PackagePrintBreadcrumb } from "./PackagePrintBreadcrumb";
import { PackagePrintBuyerChrome } from "./PackagePrintBuyerChrome";
import { PackagePrintNextReviewFooterClient } from "./PackagePrintNextReviewFooterClient";
import { PackagePrintTransparencyTrailSection } from "./PackagePrintTransparencyTrailSection";
import { ActorDependentFindingsQuietEnginesHint } from "@/components/findings/ActorDependentFindingsQuietEnginesHint";

export type PackagePrintPageViewProps = {
  readonly presentation: PackagePrintPresentation;
  readonly listScopedRunId?: string | null;
  readonly parentArchitectureId?: string | null;
  readonly meetingCaptureBlockedReason?: string | null;
};

/** Print-friendly architecture package summary (TB-2205). */
export function PackagePrintPageView(props: PackagePrintPageViewProps): React.JSX.Element {
  const { presentation, listScopedRunId = null, meetingCaptureBlockedReason = null } = props;
  const { reviewJobHref: backHref } = useWorkingBackLocator({
    reviewId: presentation.runId,
    reviewTab: "review-package",
  });
  const buyerPolishedShell = useProductionEvalChrome();
  const scopedListRunId = (listScopedRunId ?? "").trim();
  const listScopedRunFilterActive = scopedListRunId.length > 0;
  const packagePrintInspectSteps = resolvePackagePrintInspectSteps({
    reviewPicked: presentation.runId.trim().length > 0,
    summaryLoaded: true,
    printReady: true,
  });
  const packagePrintInspectEmphasizedStepId = resolvePackagePrintInspectEmphasizedStepId({
    reviewPicked: presentation.runId.trim().length > 0,
    summaryLoaded: true,
    printReady: true,
  });
  const packagePrintClearScopeHref = buildPackagePrintPath(presentation.runId);
  const meetingCaptureEntries = presentation.meetingCaptureEntries ?? [];
  const showMeetingCapture = hasReviewMeetingCapture(meetingCaptureEntries);

  const packagePrintPageHeader = (
    <OperatorPageHeader
      title={presentation.title}
      titleTestId="package-print-title"
      headingLevel="h1"
      breadcrumb={
        buyerPolishedShell ? (
          <PackagePrintBreadcrumb
            runId={presentation.runId}
            reviewTitle={presentation.title}
            backHref={backHref}
          />
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {PACKAGE_PRINT_PAGE_TITLE}
          </p>
        )
      }
      subtitle={
        buyerPolishedShell ? <p className="m-0">{PACKAGE_PRINT_PAGE_SUBTITLE_BUYER}</p> : undefined
      }
      subtitleClassName="max-w-3xl leading-relaxed"
      metadata={
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {PACKAGE_PRINT_META_CREATED_LABEL}: {formatInstantForLocale(presentation.createdUtc)}
        </span>
      }
    />
  );

  const packagePrintWorkspaceBody = (
    <>
      <section className="space-y-2" aria-labelledby="package-print-status-heading">
        <h2 id="package-print-status-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {PACKAGE_PRINT_STATUS_HEADING}
        </h2>
        <StatusTag
          kind={presentation.statusKind}
          label={presentation.statusLabel}
          data-testid="package-print-status"
        />
      </section>

      <section className="space-y-2" aria-labelledby="package-print-findings-heading">
        <h2 id="package-print-findings-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {PACKAGE_PRINT_FINDINGS_HEADING}
        </h2>
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="package-print-findings-summary"
        >
          {presentation.findingsSummary}
        </p>
      </section>

      {presentation.sponsorSynopsis !== null ? (
        <section className="space-y-2" aria-labelledby="package-print-synopsis-heading">
          <h2 id="package-print-synopsis-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {PACKAGE_PRINT_SYNOPSIS_HEADING}
          </h2>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="package-print-sponsor-synopsis"
          >
            {presentation.sponsorSynopsis}
          </p>
        </section>
      ) : null}

      {showMeetingCapture ? (
        <section
          id={PACKAGE_PRINT_MEETING_CAPTURE_SECTION_ID}
          className="space-y-2"
          aria-labelledby="package-print-meeting-capture-heading"
          data-testid="package-print-meeting-capture"
        >
          <h2 id="package-print-meeting-capture-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {PACKAGE_PRINT_MEETING_CAPTURE_HEADING}
          </h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REVIEW_MEETING_CAPTURE_DISCLAIMER}
          </p>
          <ol className="m-0 list-decimal space-y-3 pl-5">
            {meetingCaptureEntries.map((entry) => (
              <li key={`${entry.questionLabel}:${entry.answer}`} className="space-y-1">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {entry.questionLabel}
                </p>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{entry.answer}</p>
                {entry.responderLabel !== null || entry.recordedAtLabel !== null ? (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {[entry.responderLabel, entry.recordedAtLabel].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {presentation.transparencyTrail !== undefined ? (
        <PackagePrintTransparencyTrailSection trail={presentation.transparencyTrail ?? null} />
      ) : null}

      {presentation.showQuietEnginesHint === true ? (
        <div data-testid="package-print-quiet-engines-hint">
          <ActorDependentFindingsQuietEnginesHint show workingMode runId={presentation.runId} />
        </div>
      ) : null}

      {!buyerPolishedShell ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="package-print-coverage-honesty"
        >
          {presentation.coverageHonestyLine?.trim().length
            ? presentation.coverageHonestyLine
            : PACKAGE_PRINT_COVERAGE_HONESTY_LINE}
        </p>
      ) : presentation.coverageHonestyLine?.trim().length ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="package-print-coverage-honesty"
        >
          {presentation.coverageHonestyLine}
        </p>
      ) : null}
    </>
  );

  return (
    <div
      className="w-full max-w-3xl space-y-4 p-4 print:max-w-none print:p-0"
      data-testid="package-print-page"
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 print:hidden"
        data-testid="package-print-actions"
      >
        <Link href={backHref} className={OPERATOR_LINK.inline} data-testid="package-print-back">
          {PACKAGE_PRINT_BACK_LABEL}
        </Link>
        <PackagePrintButton
          runId={presentation.runId}
          manifestVersion={presentation.manifestVersionForGuard}
        />
      </div>

      {!buyerPolishedShell ? (
        <p
          className={cn("m-0 text-al-text-secondary print:hidden", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="package-print-instructions"
        >
          {PACKAGE_PRINT_INSTRUCTIONS}
        </p>
      ) : null}

      {listScopedRunFilterActive ? (
        <p
          className={cn("m-0 text-al-text-secondary print:hidden", OPERATOR_TYPOGRAPHY.body)}
          data-testid="package-print-run-scope-banner"
        >
          {"Print view scoped to findings queue for review "}
          <span className="font-mono text-al-text-primary">{scopedListRunId}</span>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={packagePrintClearScopeHref}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_LINK.inline}
            href={`/architecture/reviews/${encodeURIComponent(scopedListRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : null}

      {!buyerPolishedShell ? (
        <div className="print:hidden">
          <IntegrationConnectChecklist
            title="Package print checklist"
            steps={packagePrintInspectSteps}
            emphasizedStepId={packagePrintInspectEmphasizedStepId}
            testIdPrefix="package-print"
          />
        </div>
      ) : null}

      <DocumentLayout>
        {buyerPolishedShell ? (
          <>
            <a href={`#${PACKAGE_PRINT_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
              {PACKAGE_PRINT_SKIP_LINK_LABEL}
            </a>

            <div
              id={PACKAGE_PRINT_PRIMARY_CONTENT_ID}
              data-testid={PACKAGE_PRINT_PRIMARY_CONTENT_ID}
              className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
            >
              <div data-testid="package-print-workspace-header">{packagePrintPageHeader}</div>

              <div
                id={PACKAGE_PRINT_FIRST_VIEWPORT_ID}
                data-testid={PACKAGE_PRINT_FIRST_VIEWPORT_ID}
                className={cn(
                  "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                  OPERATOR_LAYOUT.sectionStack,
                )}
              >
                <PackagePrintBuyerChrome runId={presentation.runId} />
                {packagePrintWorkspaceBody}
                {!showMeetingCapture && meetingCaptureBlockedReason !== null ? (
                  <section
                    className="space-y-2 print:hidden"
                    data-testid="package-print-meeting-capture-blocked"
                  >
                    <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {PACKAGE_PRINT_MEETING_CAPTURE_HEADING}
                    </h2>
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                      {meetingCaptureBlockedReason}
                    </p>
                  </section>
                ) : null}
              </div>

              <div className="print:hidden">
                <IntegrationConnectChecklist
                  title="Package print checklist"
                  steps={packagePrintInspectSteps}
                  emphasizedStepId={packagePrintInspectEmphasizedStepId}
                  testIdPrefix="package-print"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {packagePrintPageHeader}
            <PackagePrintBuyerChrome runId={presentation.runId} />
            {packagePrintWorkspaceBody}
          </>
        )}
      </DocumentLayout>

      <PackagePrintNextReviewFooterClient runId={presentation.runId} />
    </div>
  );
}

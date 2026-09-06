"use client";

import Link from "next/link";

import { DocumentLayout } from "@/components/DocumentLayout";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PackagePrintButton } from "@/components/reviews/PackagePrintButton";
import { StatusTag } from "@/components/ui/status-tag";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolvePackagePrintInspectEmphasizedStepId,
  resolvePackagePrintInspectSteps,
} from "@/lib/package-print-inspect-checklist";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { PACKAGE_PRINT_PAGE_SUBTITLE_BUYER } from "@/lib/package-print-page-copy";
import {
  PACKAGE_PRINT_BACK_LABEL,
  PACKAGE_PRINT_FINDINGS_HEADING,
  PACKAGE_PRINT_INSTRUCTIONS,
  PACKAGE_PRINT_META_CREATED_LABEL,
  PACKAGE_PRINT_PAGE_TITLE,
  PACKAGE_PRINT_STATUS_HEADING,
  PACKAGE_PRINT_SYNOPSIS_HEADING,
  PACKAGE_PRINT_COVERAGE_HONESTY_LINE,
  buildPackagePrintBackHref,
  buildPackagePrintPath,
  type PackagePrintPresentation,
} from "@/lib/package-print-view";
import { cn } from "@/lib/utils";

import { PackagePrintBreadcrumb } from "./PackagePrintBreadcrumb";
import { PackagePrintBuyerChrome } from "./PackagePrintBuyerChrome";
import { PackagePrintNextReviewFooterClient } from "./PackagePrintNextReviewFooterClient";

export type PackagePrintPageViewProps = {
  readonly presentation: PackagePrintPresentation;
  readonly listScopedRunId?: string | null;
};

/** Print-friendly architecture package summary (TB-2205). */
export function PackagePrintPageView(props: PackagePrintPageViewProps): React.JSX.Element {
  const { presentation, listScopedRunId = null } = props;
  const backHref = buildPackagePrintBackHref(presentation.runId);
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
        <PackagePrintButton />
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

      {buyerPolishedShell ? (
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
        <OperatorPageHeader
          title={presentation.title}
          titleTestId="package-print-title"
          headingLevel="h1"
          breadcrumb={
            buyerPolishedShell ? (
              <PackagePrintBreadcrumb runId={presentation.runId} reviewTitle={presentation.title} />
            ) : (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {PACKAGE_PRINT_PAGE_TITLE}
              </p>
            )
          }
          subtitle={
            buyerPolishedShell ? (
              <p className="m-0">{PACKAGE_PRINT_PAGE_SUBTITLE_BUYER}</p>
            ) : undefined
          }
          subtitleClassName="max-w-3xl leading-relaxed"
          metadata={
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {PACKAGE_PRINT_META_CREATED_LABEL}: {formatInstantForLocale(presentation.createdUtc)}
            </span>
          }
        />

        <PackagePrintBuyerChrome runId={presentation.runId} />

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

        {!buyerPolishedShell ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="package-print-coverage-honesty"
          >
            {presentation.coverageHonestyLine?.trim().length
              ? presentation.coverageHonestyLine
              : PACKAGE_PRINT_COVERAGE_HONESTY_LINE}
          </p>
        ) : null}
      </DocumentLayout>

      <PackagePrintNextReviewFooterClient runId={presentation.runId} />
    </div>
  );
}

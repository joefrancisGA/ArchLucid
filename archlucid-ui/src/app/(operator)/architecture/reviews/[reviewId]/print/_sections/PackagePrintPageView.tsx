"use client";

import Link from "next/link";

import { DocumentLayout } from "@/components/DocumentLayout";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PackagePrintButton } from "@/components/reviews/PackagePrintButton";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
  buildPackagePrintBackHref,
  type PackagePrintPresentation,
} from "@/lib/package-print-view";
import { cn } from "@/lib/utils";

import { PackagePrintBreadcrumb } from "./PackagePrintBreadcrumb";
import { PackagePrintBuyerChrome } from "./PackagePrintBuyerChrome";
import { PackagePrintNextReviewFooterClient } from "./PackagePrintNextReviewFooterClient";

export type PackagePrintPageViewProps = {
  readonly presentation: PackagePrintPresentation;
};

/** Print-friendly architecture package summary (TB-2205). */
export function PackagePrintPageView(props: PackagePrintPageViewProps): React.JSX.Element {
  const { presentation } = props;
  const backHref = buildPackagePrintBackHref(presentation.runId);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

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
      </DocumentLayout>

      <PackagePrintNextReviewFooterClient runId={presentation.runId} />
    </div>
  );
}

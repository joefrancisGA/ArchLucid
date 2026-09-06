"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CopyIdButton } from "@/components/CopyIdButton";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import {
  ArchitecturePackageOriginMetadataLine,
  resolveRunHomeStatusTag,
  runListPrimaryTitle,
} from "@/components/operator-home/runs-dashboard-helpers";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import { finalizedReviewRecordDisplayLabel } from "@/lib/buyer/finalized-review-record-display-label";
import { isShowcaseSampleOfAnyKind } from "@/lib/demo-run-canonical";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK, BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER, formatOperatorHomeFeaturedFindingsSummary } from "@/lib/buyer/buyer-polish-copy";
import {
  INLINE_METADATA_LABEL_CLASS,
  OPERATOR_CARD,
  OPERATOR_LINK,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import {
  formatRunHomeListInsightLine,
  formatRunHomeListUpdatedLabel,
  resolveRunFindingCountDisplay,
  resolveRunWarningCountDisplay,
} from "@/lib/operator/operator-home-run-list-insight";
import { formatRunListTitleWithDisambiguator } from "@/lib/operator/run-home-list-disambiguator";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import {
  operatorHomeBuyerProofDetailsDisclosureHrefFromSearch,
  parseOperatorHomeBuyerProofDetailsOpenFromSearch,
} from "@/lib/operator/operator-home-buyer-proof-details-disclosure-url";
import type { RunSummary } from "@/types/authority";

type OperatorHomeReviewSummaryCardProps = {
  readonly run: RunSummary;
  readonly href: string;
  readonly buyerPolishedShell: boolean;
  readonly variant?: "list" | "featured" | "compact";
  readonly siblingRuns?: readonly RunSummary[];
  readonly primaryAction?: { readonly href: string; readonly label: string } | null;
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

function formatFindingsMetadata(run: RunSummary): string | null {
  const findings = resolveRunFindingCountDisplay(run);
  const warnings = resolveRunWarningCountDisplay(run);

  if (findings === null) {
    return null;
  }

  if (warnings !== null && warnings > 0) {
    return BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK(findings, warnings);
  }

  return `${findings} finding${findings === 1 ? "" : "s"}`;
}

function ReviewSummaryMetadataItem(props: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0">
      <dt className={cn("m-0", INLINE_METADATA_LABEL_CLASS)}>
        <InlineMetadataLabel label={props.label} withColon={false} />
      </dt>
      <dd className={cn("m-0 mt-0.5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.dataValue)}>
        {props.value}
      </dd>
    </div>
  );
}

type FeaturedShowcaseSummaryProps = {
  readonly run: RunSummary;
  readonly title: string;
  readonly buyerPolishedShell: boolean;
  readonly primaryAction?: { readonly href: string; readonly label: string } | null;
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

function BuyerProofDetailsDisclosure(props: {
  readonly run: RunSummary;
  readonly buyerPolishedShell: boolean;
  readonly recordHref: string;
  readonly recordLabel: string;
  readonly monitoredRiskClarifier: string | null;
  readonly showcaseApprovalAuthority: string;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const operatorHomeBuyerProofDetailsOpenParam = searchParams.get("operatorHomeBuyerProofDetailsOpen");
  const [open, setOpenState] = useState(() =>
    parseOperatorHomeBuyerProofDetailsOpenFromSearch(operatorHomeBuyerProofDetailsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        operatorHomeBuyerProofDetailsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseOperatorHomeBuyerProofDetailsOpenFromSearch(operatorHomeBuyerProofDetailsOpenParam));
  }, [operatorHomeBuyerProofDetailsOpenParam]);

  return (
    <details
      className="group"
      data-testid="runs-dashboard-buyer-proof-details"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer list-none", OPERATOR_LINK.nav)}>
        <span className="group-open:hidden">Details</span>
        <span className="hidden group-open:inline">Hide details</span>
      </summary>
      <div className="mt-2 space-y-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
        {props.monitoredRiskClarifier !== null ? (
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.navHelper)}>
            {props.monitoredRiskClarifier}
          </p>
        ) : null}
        <ArchitecturePackageOriginMetadataLine run={props.run} buyerPolishedShell={props.buyerPolishedShell} />
        <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.navHelper)}>
          Approver: {props.showcaseApprovalAuthority}
        </p>
        <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-600 dark:text-neutral-400">Finalized review record: </span>
          <Link
            href={props.recordHref}
            className={OPERATOR_LINK.nav}
            title={SHOWCASE_STATIC_DEMO_MANIFEST_ID}
            data-testid="runs-dashboard-buyer-proof-finalized-record-link"
          >
            {props.recordLabel}
          </Link>
          <CopyIdButton value={SHOWCASE_STATIC_DEMO_MANIFEST_ID} aria-label="Copy finalized review record ID" />
        </p>
      </div>
    </details>
  );
}

function FeaturedShowcaseReviewSummary(props: FeaturedShowcaseSummaryProps): React.JSX.Element | null {
  const showcaseProofMeta = buyerDemoPackageCardMeta(props.run.runId ?? "");

  if (showcaseProofMeta === null) {
    return null;
  }

  const primaryActionVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";
  const recordHref = signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID);
  const recordLabel = finalizedReviewRecordDisplayLabel(props.run, SHOWCASE_STATIC_DEMO_MANIFEST_ID, {
    cardTitle: props.title,
  });
  const findingsValue = formatOperatorHomeFeaturedFindingsSummary(
    SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
    SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
  );
  const monitoredRiskClarifier =
    SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount > 0 ? BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER : null;

  return (
    <div
      className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
      data-testid="runs-dashboard-buyer-proof-metadata"
    >
      <dl className="m-0 grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
        <ReviewSummaryMetadataItem label="Decision" value="Package finalized" />
        <ReviewSummaryMetadataItem label="Findings" value={findingsValue} />
        <ReviewSummaryMetadataItem label="Evidence" value="Ready" />
        <ReviewSummaryMetadataItem label="Audit" value="Complete" />
        <ReviewSummaryMetadataItem label="Finalized" value={showcaseProofMeta.decisionDate} />
      </dl>

      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {props.primaryAction !== null && props.primaryAction !== undefined ? (
            primaryActionVariant === "primary" ? (
              <Button asChild variant="primary" size="sm" className="h-8">
                <Link href={props.primaryAction.href}>{props.primaryAction.label}</Link>
              </Button>
            ) : (
              <Link
                href={props.primaryAction.href}
                className={cn("font-medium", OPERATOR_LINK.nav)}
              >
                {props.primaryAction.label}
              </Link>
            )
          ) : null}
          <Link
            href={recordHref}
            className={OPERATOR_LINK.nav}
            data-testid="runs-dashboard-buyer-proof-view-record-link"
          >
            View record
          </Link>
        </div>
        <BuyerProofDetailsDisclosure
          run={props.run}
          buyerPolishedShell={props.buyerPolishedShell}
          recordHref={recordHref}
          recordLabel={recordLabel}
          monitoredRiskClarifier={monitoredRiskClarifier}
          showcaseApprovalAuthority={showcaseProofMeta.approvalAuthority}
        />
      </div>
    </div>
  );
}

/** Compact review summary card for Overview recent reviews (list + featured showcase). */
export function OperatorHomeReviewSummaryCard(props: OperatorHomeReviewSummaryCardProps): React.JSX.Element {
  const variant = props.variant ?? "list";
  const statusTag = resolveRunHomeStatusTag(props.run);
  const siblingRuns = props.siblingRuns ?? [props.run];
  const title =
    variant === "compact"
      ? formatRunListTitleWithDisambiguator(props.run, siblingRuns)
      : runListPrimaryTitle(props.run);
  const insightLine = formatRunHomeListInsightLine(props.run);
  const updatedPresentation = formatRunHomeListUpdatedLabel(props.run);
  const updatedSummaryLabel =
    updatedPresentation !== null
      ? `${updatedPresentation.absoluteLabel} · ${updatedPresentation.relativeLabel}`
      : null;
  const findingsMetadata = formatFindingsMetadata(props.run);
  const isShowcaseDemo = isShowcaseSampleOfAnyKind(props.run.runId ?? "");
  const isExampleReview =
    isShowcaseDemo || isDemoSeededOverviewInjectedRun(props.run);
  const showcaseProofMetadata = variant === "featured" && isShowcaseDemo;
  const insightText = [insightLine, updatedSummaryLabel].filter((part) => part !== null).join(" · ");

  if (variant === "compact") {
    return (
      <article
        className="border-b border-neutral-200 py-2 last:border-b-0 dark:border-neutral-800"
        data-testid={`operator-home-review-summary-${props.run.runId}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <Link
              href={props.href}
              title={title}
              className={cn("line-clamp-2 min-w-0", OPERATOR_LINK.nav, OPERATOR_TYPE_SCALE.cardTitle)}
            >
              {title}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag
                kind={statusTag.kind}
                label={statusTag.label}
                data-testid={`run-home-status-tag-${props.run.runId}`}
              />
              {isExampleReview ? <DemoDataBadge /> : null}
              {updatedPresentation !== null ? (
                <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}>
                  <time dateTime={updatedPresentation.isoUtc}>{updatedPresentation.absoluteLabel}</time>
                  {" · "}
                  {updatedPresentation.relativeLabel}
                </span>
              ) : null}
            </div>
            <ArchitecturePackageOriginMetadataLine run={props.run} buyerPolishedShell={props.buyerPolishedShell} />
          </div>
          <Link href={props.href} className={cn("shrink-0 font-medium", OPERATOR_LINK.optional)}>
            Open
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        variant === "featured"
          ? "space-y-2 py-1"
          : cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.nested, "space-y-2 transition-shadow hover:shadow-sm"),
      )}
      data-testid={variant === "featured" ? "runs-dashboard-buyer-proof-summary" : `operator-home-review-summary-${props.run.runId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href={props.href}
            className={cn("min-w-0", OPERATOR_LINK.nav, OPERATOR_TYPE_SCALE.cardTitle)}
            data-testid={variant === "featured" ? "runs-dashboard-buyer-proof-title" : undefined}
          >
            {title}
          </Link>
          {isExampleReview ? <DemoDataBadge /> : null}
        </div>
        <StatusTag
          kind={statusTag.kind}
          label={statusTag.label}
          data-testid={`run-home-status-tag-${props.run.runId}`}
        />
      </div>

      {showcaseProofMetadata ? (
        <FeaturedShowcaseReviewSummary
          run={props.run}
          title={title}
          buyerPolishedShell={props.buyerPolishedShell}
          primaryAction={props.primaryAction}
          pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
        />
      ) : (
        <>
          <ArchitecturePackageOriginMetadataLine run={props.run} buyerPolishedShell={props.buyerPolishedShell} />

          <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {findingsMetadata !== null ? (
              <ReviewSummaryMetadataItem label="Findings" value={findingsMetadata} />
            ) : null}
            {updatedPresentation !== null ? (
              <ReviewSummaryMetadataItem
                label="Last updated"
                value={`${updatedPresentation.absoluteLabel} · ${updatedPresentation.relativeLabel}`}
              />
            ) : null}
          </dl>

          {insightText.length > 0 ? (
            <p
              className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}
              data-testid={`run-home-list-insight-${props.run.runId}`}
            >
              {insightText}
            </p>
          ) : null}

          {props.primaryAction !== null && props.primaryAction !== undefined ? (
            <Button
              asChild
              variant={props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary"}
              size="sm"
              className="mt-1 h-8"
            >
              <Link href={props.primaryAction.href}>{props.primaryAction.label}</Link>
            </Button>
          ) : null}
        </>
      )}
    </article>
  );
}

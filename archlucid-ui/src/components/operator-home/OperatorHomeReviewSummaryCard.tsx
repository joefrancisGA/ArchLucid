import Link from "next/link";

import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import {
  ArchitecturePackageOriginMetadataLine,
  resolveRunHomeStatusTag,
  runListPrimaryTitle,
} from "@/components/operator-home/runs-dashboard-helpers";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK } from "@/lib/buyer/buyer-polish-copy";
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
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

type OperatorHomeReviewSummaryCardProps = {
  readonly run: RunSummary;
  readonly href: string;
  readonly buyerPolishedShell: boolean;
  readonly variant?: "list" | "featured";
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
      <dd className={cn("m-0 mt-0.5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
        {props.value}
      </dd>
    </div>
  );
}

/** Compact review summary card for Overview recent reviews (list + featured showcase). */
export function OperatorHomeReviewSummaryCard(props: OperatorHomeReviewSummaryCardProps): React.JSX.Element {
  const variant = props.variant ?? "list";
  const statusTag = resolveRunHomeStatusTag(props.run);
  const title = runListPrimaryTitle(props.run);
  const insightLine = formatRunHomeListInsightLine(props.run);
  const updatedLabel = formatRunHomeListUpdatedLabel(props.run);
  const findingsMetadata = formatFindingsMetadata(props.run);
  const isShowcaseDemo = isShowcaseStaticDemoRunId(props.run.runId ?? "");
  const isExampleReview =
    isShowcaseDemo || isDemoSeededOverviewInjectedRun(props.run);
  const showcaseProofMetadata = variant === "featured" && isShowcaseDemo;
  const showcaseProofMeta = showcaseProofMetadata ? buyerDemoPackageCardMeta(props.run.runId ?? "") : null;
  const insightText = [insightLine, updatedLabel].filter((part) => part !== null).join(" · ");

  return (
    <article
      className={cn(
        OPERATOR_SURFACE_CARD_CLASS,
        variant === "featured"
          ? cn(OPERATOR_CARD.nested, "space-y-2")
          : cn(OPERATOR_CARD.nested, "space-y-2 transition-shadow hover:shadow-sm"),
      )}
      data-testid={variant === "featured" ? "runs-dashboard-buyer-proof-summary" : `operator-home-review-summary-${props.run.runId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link
          href={props.href}
          className={cn("min-w-0", OPERATOR_LINK.nav, OPERATOR_TYPE_SCALE.cardTitle)}
          data-testid={variant === "featured" ? "runs-dashboard-buyer-proof-title" : undefined}
        >
          {title}
        </Link>
        <StatusTag
          kind={statusTag.kind}
          label={statusTag.label}
          data-testid={`run-home-status-tag-${props.run.runId}`}
        />
      </div>

      {isExampleReview ? <DemoDataBadge /> : null}

      <ArchitecturePackageOriginMetadataLine run={props.run} buyerPolishedShell={props.buyerPolishedShell} />

      {showcaseProofMetadata ? (
        <div className="space-y-1" data-testid="runs-dashboard-buyer-proof-metadata">
          {/* Decision is metadata, not the card title — it must not outrank the review link above. */}
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
            Decision: Package finalized
          </p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK(
              SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
              SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
            )}
          </p>
          <InlineMetadataLine label="Evidence trail" value="Ready" />
          <InlineMetadataLine label="Audit trail" value="Complete" />
          {showcaseProofMeta !== null ? (
            <>
              <InlineMetadataLine label="Decision date" value={showcaseProofMeta.decisionDate} />
              <InlineMetadataLine label="Sealed review record" value={SHOWCASE_STATIC_DEMO_MANIFEST_ID} />
              <InlineMetadataLine label="Approver" value={showcaseProofMeta.approvalAuthority} />
            </>
          ) : null}
        </div>
      ) : (
        <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {findingsMetadata !== null ? (
            <ReviewSummaryMetadataItem label="Findings" value={findingsMetadata} />
          ) : null}
          {updatedLabel !== null ? (
            <ReviewSummaryMetadataItem label="Last updated" value={updatedLabel.replace(/^Updated /, "")} />
          ) : null}
        </dl>
      )}

      {/* The proof block already states findings, monitored risk, and the decision — do not restate them. */}
      {!showcaseProofMetadata && insightText.length > 0 ? (
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
    </article>
  );
}

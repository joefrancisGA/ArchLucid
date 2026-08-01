import Link from "next/link";

import {
  ArchitecturePackageOriginBadge,
  resolveRunHomeStatusTag,
  runListPrimaryTitle,
} from "@/components/operator-home/runs-dashboard-helpers";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK } from "@/lib/buyer-polish-copy";
import {
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
} from "@/lib/operator-home-run-list-insight";
import { SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

type OperatorHomeReviewSummaryCardProps = {
  readonly run: RunSummary;
  readonly href: string;
  readonly buyerPolishedShell: boolean;
  readonly variant?: "list" | "featured";
  readonly primaryAction?: { readonly href: string; readonly label: string } | null;
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
      <dt className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>{props.label}</dt>
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

      {isShowcaseDemo ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}>
          Completed example review · Approved with monitoring
        </p>
      ) : null}

      <ArchitecturePackageOriginBadge run={props.run} buyerPolishedShell={props.buyerPolishedShell} />

      {variant === "featured" && isShowcaseDemo ? (
        <div className="space-y-1">
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle, "text-neutral-900 dark:text-neutral-100")}>
            Decision: Package finalized
          </p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            Governance approval: Approved with monitoring
          </p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK(
              SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
              SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
            )}
          </p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            Evidence trail: Ready
          </p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            Audit trail: Complete
          </p>
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

      {insightText.length > 0 ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}
          data-testid={`run-home-list-insight-${props.run.runId}`}
        >
          {insightText}
        </p>
      ) : null}

      {props.primaryAction !== null && props.primaryAction !== undefined ? (
        <Button asChild variant="primary" size="sm" className="mt-1 h-8">
          <Link href={props.primaryAction.href}>{props.primaryAction.label}</Link>
        </Button>
      ) : null}
    </article>
  );
}

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor-report-pilot-roi-measurement-help";
import {
  costEvidenceFreshnessStatusTagKind,
  formatSponsorHeadlineScopeCodeLabel,
} from "@/lib/sponsor-roi-proof-status-strip";
import { presentCostEvidenceFreshness } from "@/lib/sponsor-roi-kpi-display";
import {
  resolveSponsorHeadlineScopeLabel,
  resolveSponsorSystemRowScopeLabel,
} from "@/lib/roi-sponsor-scope-labels";

export const SPONSOR_ROI_PROOF_STATUS_HELP_HREF = SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF;

export type SponsorRoiProofStatusStripProps = {
  readonly summary: SponsorRoiSummary;
  readonly loading?: boolean;
  readonly executiveSurface?: boolean;
};

/** First-screen proof posture for sponsor ROI: evidence freshness, scope, and non-summing row guidance. */
export function SponsorRoiProofStatusStrip(props: SponsorRoiProofStatusStripProps): ReactElement {
  const loading = props.loading === true;
  const executiveSurface = props.executiveSurface === true;
  const { summary } = props;

  const costFreshness = presentCostEvidenceFreshness({
    loading,
    status: summary.costEvidenceFreshnessStatus,
    savingsPricingBasis: summary.savingsPricingBasis,
    staleAfterDays: summary.costEvidenceStaleAfterDays,
    executiveSurface,
  });
  const costEvidenceKind = costEvidenceFreshnessStatusTagKind(costFreshness.state);
  const headlineScopeLabel = resolveSponsorHeadlineScopeLabel(summary);
  const systemRowScopeLabel = resolveSponsorSystemRowScopeLabel(summary);
  const scopeCodeLabel = formatSponsorHeadlineScopeCodeLabel(summary.headlineSavingsScopeCode);

  return (
    <section
      aria-labelledby="exec-roi-proof-status-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40"
      data-testid="exec-roi-proof-status-strip"
    >
      <h3
        id="exec-roi-proof-status-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Evidence &amp; ROI proof status
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusTag
          kind={costEvidenceKind}
          label={`Cost evidence: ${costFreshness.display}`}
          data-testid="exec-roi-proof-cost-evidence-tag"
          title={costFreshness.footnote ?? undefined}
        />
        {scopeCodeLabel !== null ? (
          <StatusTag
            kind="neutral"
            label={scopeCodeLabel}
            data-testid="exec-roi-proof-headline-scope-tag"
            title={headlineScopeLabel}
          />
        ) : null}
      </div>

      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {headlineScopeLabel}
      </p>

      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {systemRowScopeLabel}{" "}
        <Link
          href={SPONSOR_ROI_PROOF_STATUS_HELP_HREF}
          className={OPERATOR_LINK.inline}
          data-testid="exec-roi-proof-roi-methodology-link"
        >
          ROI methodology
        </Link>
        {" · "}
        <Link
          href="/administration/baseline"
          className={OPERATOR_LINK.inline}
          data-testid="exec-roi-proof-baseline-settings-link"
        >
          Baseline settings
        </Link>
      </p>

      {costFreshness.footnote ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {costFreshness.footnote}
          {costFreshness.runbookHref ? (
            <>
              {" "}
              <Link
                href={toDocsBlobUrl(costFreshness.runbookHref)}
                className={OPERATOR_LINK.inline}
                data-testid="exec-roi-proof-extractor-runbook-link"
              >
                Azure inventory upload
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}

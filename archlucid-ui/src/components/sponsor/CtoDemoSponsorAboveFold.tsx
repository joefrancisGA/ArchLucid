import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { CtoDemoSponsorTenantIsolationCallout } from "@/components/cto-demo/CtoDemoSponsorTenantIsolationCallout";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import {
  buildStaticCtoDemoRecapPayload,
  formatCtoDemoHeroStat,
  formatCtoDemoHeroSubStat,
} from "@/lib/buyer/buyer-cto-demo-recap";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY, operatorSemanticBadge } from "@/lib/design-tokens";
import { getFindingEvidenceInspectHref } from "@/lib/findings/finding-evidence-navigation";
import { severityFromTrace, severitySortRank } from "@/lib/sponsor-finding-severity";
import { decisionGradeSponsorTraceRows } from "@/lib/sponsor-decision-grade-trace-rows";
import { verdictTierFromRiskPosture, verdictTierLabel, verdictTierTone } from "@/lib/verdict-taxonomy";
import type { FindingTraceConfidenceDto } from "@/types/explanation";
import type { RunExplanationSummary } from "@/types/explanation";

export type CtoDemoSponsorTopRisk = {
  readonly findingId: string;
  readonly title: string;
  readonly severity: string;
};

export type CtoDemoSponsorAboveFoldProps = {
  readonly runId: string;
  readonly headline: string;
  readonly summary: RunExplanationSummary;
  readonly topRisks: readonly CtoDemoSponsorTopRisk[];
};

function pickRecommendedSponsorAction(summary: RunExplanationSummary): string {
  const risk = summary.explanation?.riskImplications?.find((r) => r.trim().length > 0)?.trim();

  if (risk !== null && risk !== undefined && risk.length > 0) {
    return risk;
  }

  const driver = summary.explanation?.keyDrivers?.find((d) => d.trim().length > 0)?.trim();

  if (driver !== null && driver !== undefined && driver.length > 0) {
    return driver;
  }

  return "Review prioritized findings below and align control owners on monitored items before the next production change window.";
}

function verdictTierBadgeClassName(tier: ReturnType<typeof verdictTierFromRiskPosture>): string {
  const tone = verdictTierTone(tier);

  if (tone === "success") {
    return operatorSemanticBadge("ready");
  }

  if (tone === "danger") {
    return operatorSemanticBadge("blocked");
  }

  return operatorSemanticBadge("attention");
}

const governanceStepHref = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[3]?.href ?? "/governance/approval-queue";

/** Compact CTO demo landing hero — verdict, top risks, and sponsor action above the fold (#4). */
export function CtoDemoSponsorAboveFold(props: CtoDemoSponsorAboveFoldProps): ReactElement {
  const { runId, headline, summary, topRisks } = props;
  const recommendedAction = pickRecommendedSponsorAction(summary);
  const verdictTier = verdictTierFromRiskPosture(summary.riskPosture ?? "");
  const showHeroStat = isCtoDemoPackEnv();
  const heroPayload = buildStaticCtoDemoRecapPayload();
  const heroStat = formatCtoDemoHeroStat(heroPayload);
  const heroSubStat = formatCtoDemoHeroSubStat(heroPayload);

  return (
    <section
      aria-label="Sponsor decision at a glance"
      data-testid="cto-demo-sponsor-above-fold"
      className={cn("space-y-4 px-4 py-4 sm:px-5", DESIGN_TOKENS.banner.page)}
    >
      {showHeroStat ? (
        <div className={cn("p-3", DESIGN_TOKENS.surface.card)} data-testid="cto-demo-hero-stat">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.executiveDashboardMetric)}>{heroStat}</p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{heroSubStat}</p>
        </div>
      ) : null}
      <div className="space-y-1">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "font-semibold uppercase tracking-wide text-al-text-secondary")}>
          CTO demo — sponsor report
        </p>
        <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{headline}</h1>
        <CtoDemoSponsorTenantIsolationCallout />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className={cn("p-3", DESIGN_TOKENS.surface.card)}>
          <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Verdict
          </p>
          <span
            className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold", OPERATOR_TYPOGRAPHY.helper,
              verdictTierBadgeClassName(verdictTier),
            )}
            data-testid="cto-demo-verdict-tier-badge"
          >
            {verdictTierLabel(verdictTier)}
          </span>
          <p className={cn("m-0 mt-2 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{summary.riskPosture}</p>
          <p className={cn("m-0 mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {summary.overallAssessment}
          </p>
        </div>

        <div className={cn("p-3", DESIGN_TOKENS.surface.card)}>
          <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Top risks
          </p>
          {topRisks.length === 0 ? (
            <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No prioritized findings surfaced.</p>
          ) : (
            <ol className={cn("m-0 mt-1 list-decimal space-y-2 pl-4 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
              {topRisks.map((risk) => (
                <li key={risk.findingId}>
                  <span className="font-medium">{risk.title}</span>
                  <span className="text-neutral-500 dark:text-neutral-400"> · {risk.severity}</span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1">
                    <CtoDemoFindingEvidenceLink runId={runId} findingId={risk.findingId} />
                    <span className="text-neutral-400" aria-hidden>
                      ·
                    </span>
                    <Link
                      href={governanceStepHref}
                      className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`finding-governance-link-${risk.findingId}`}
                    >
                      Review controls
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className={cn("p-3", DESIGN_TOKENS.surface.card)}>
          <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Recommended action
          </p>
          <p className={cn("m-0 mt-1 leading-relaxed text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>{recommendedAction}</p>
        </div>
      </div>
    </section>
  );
}

export function traceRowsToCtoDemoTopRisks(
  traces: readonly FindingTraceConfidenceDto[],
  limit = 3,
): CtoDemoSponsorTopRisk[] {
  const ranked = decisionGradeSponsorTraceRows(traces)
    .map((t) => {
      const findingId = t.findingId.trim();
      const titleRaw = (t.findingTitle ?? findingId).trim();

      return {
        findingId,
        title: titleRaw.length > 0 ? titleRaw : findingId,
        severity: severityFromTrace(t.traceConfidenceLabel),
        sortKey: severitySortRank(t.traceConfidenceLabel),
      };
    });

  ranked.sort((a, b) => a.sortKey - b.sortKey);

  return ranked.slice(0, limit).map(({ findingId, title, severity }) => ({ findingId, title, severity }));
}

export function CtoDemoFindingEvidenceLink(props: { readonly runId: string; readonly findingId: string }): ReactElement {
  const href = getFindingEvidenceInspectHref(props.runId, props.findingId);

  return (
    <Link
      href={href}
      className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
      data-testid={`finding-evidence-link-${props.findingId}`}
    >
      View evidence
    </Link>
  );
}

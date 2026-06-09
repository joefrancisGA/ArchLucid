import Link from "next/link";
import type { ReactElement } from "react";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer-golden-journey-nav";
import { operatorSemanticBadge } from "@/lib/design-tokens";
import { getFindingEvidenceInspectHref } from "@/lib/finding-evidence-navigation";
import { severityFromTrace, severitySortRank } from "@/lib/executive-finding-severity";
import { verdictTierFromRiskPosture, verdictTierLabel, verdictTierTone } from "@/lib/verdict-taxonomy";
import { cn } from "@/lib/utils";
import type { FindingTraceConfidenceDto } from "@/types/explanation";
import type { RunExplanationSummary } from "@/types/explanation";

export type CtoDemoExecutiveTopRisk = {
  readonly findingId: string;
  readonly title: string;
  readonly severity: string;
};

export type CtoDemoExecutiveAboveFoldProps = {
  readonly runId: string;
  readonly headline: string;
  readonly summary: RunExplanationSummary;
  readonly topRisks: readonly CtoDemoExecutiveTopRisk[];
};

function pickRecommendedExecutiveAction(summary: RunExplanationSummary): string {
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

const governanceStepHref = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[3]?.href ?? "/governance";

/** Compact CTO demo landing hero — verdict, top risks, and sponsor action above the fold (#4). */
export function CtoDemoExecutiveAboveFold(props: CtoDemoExecutiveAboveFoldProps): ReactElement {
  const { runId, headline, summary, topRisks } = props;
  const recommendedAction = pickRecommendedExecutiveAction(summary);
  const verdictTier = verdictTierFromRiskPosture(summary.riskPosture ?? "");

  return (
    <section
      aria-label="Executive decision at a glance"
      data-testid="cto-demo-executive-above-fold"
      className="space-y-4 rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50 via-white to-neutral-50 px-4 py-4 shadow-sm dark:border-teal-900/50 dark:from-teal-950/40 dark:via-neutral-950 dark:to-neutral-950 sm:px-5"
    >
      <div className="space-y-1">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-300">
          CTO demo — executive summary
        </p>
        <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">{headline}</h1>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white/90 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Verdict
          </p>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
              verdictTierBadgeClassName(verdictTier),
            )}
            data-testid="cto-demo-verdict-tier-badge"
          >
            {verdictTierLabel(verdictTier)}
          </span>
          <p className="m-0 mt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{summary.riskPosture}</p>
          <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {summary.overallAssessment}
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white/90 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Top risks
          </p>
          {topRisks.length === 0 ? (
            <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400">No prioritized findings surfaced.</p>
          ) : (
            <ol className="m-0 mt-1 list-decimal space-y-2 pl-4 text-sm text-neutral-800 dark:text-neutral-200">
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
                      className="text-xs font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
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

        <div className="rounded-lg border border-neutral-200 bg-white/90 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Recommended action
          </p>
          <p className="m-0 mt-1 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{recommendedAction}</p>
        </div>
      </div>
    </section>
  );
}

export function traceRowsToCtoDemoTopRisks(
  traces: readonly FindingTraceConfidenceDto[],
  limit = 3,
): CtoDemoExecutiveTopRisk[] {
  const ranked = traces
    .filter((t) => (t.findingId ?? "").trim().length > 0)
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
      className="text-xs font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
      data-testid={`finding-evidence-link-${props.findingId}`}
    >
      View evidence
    </Link>
  );
}

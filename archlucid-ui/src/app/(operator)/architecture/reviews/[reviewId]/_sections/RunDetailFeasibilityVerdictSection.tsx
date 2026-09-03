import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import { DecisionReceiptExportButton } from "@/components/draft-intake/DecisionReceiptExportButton";
import { FeasibilityVerdictDriversPanel } from "@/components/feasibility/FeasibilityVerdictDriversPanel";
import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";
import {
  parseFeasibilityVerdictDrivers,
} from "@/lib/feasibility-verdict-transparency-trail";
import {
  feasibilityVerdictKindLabel,
  feasibilityVerdictTone,
} from "@/lib/feasibility-verdict-display";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailFeasibilityVerdictSectionProps = {
  readonly verdict: ManifestFeasibilityVerdict;
  readonly runId: string;
};

function toneClassName(tone: "success" | "warning" | "danger"): string {
  if (tone === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100";
  }

  if (tone === "danger") {
    return "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100";
  }

  return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
}

export function RunDetailFeasibilityVerdictSection(
  props: RunDetailFeasibilityVerdictSectionProps,
): ReactElement {
  const { verdict } = props;
  const reviewId = props.runId.trim();
  const tone = feasibilityVerdictTone(verdict.kind);
  const trail = verdict.transparencyTrail;
  const verdictDrivers = parseFeasibilityVerdictDrivers(trail);

  return (
    <section id="feasibility-verdict" className="scroll-mt-24" data-testid="run-detail-feasibility-verdict">
      <div className={`rounded-lg border p-4 ${toneClassName(tone)}`}>
        <h4 className={`${runDetailSectionHeadingClass} mb-2`}>Feasibility verdict</h4>
        <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>{feasibilityVerdictKindLabel(verdict.kind)}</p>
        <p className={cn("mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{verdict.summary}</p>

        <FeasibilityVerdictDriversPanel
          drivers={verdictDrivers}
          reviewId={reviewId}
          className="mt-4"
        />

        {verdict.softEnvelope !== undefined && verdict.softEnvelope !== null ? (
          <dl className={cn("mt-4 grid gap-2 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-4", OPERATOR_TYPOGRAPHY.body)}>
            <dt className="font-medium">Confidence band</dt>
            <dd className="m-0 tabular-nums">
              {verdict.softEnvelope.confidenceLow}–{verdict.softEnvelope.confidenceHigh}
            </dd>
            <dt className="font-medium">Envelope</dt>
            <dd className="m-0">{verdict.softEnvelope.envelopeDescription}</dd>
            <dt className="font-medium">Soft assumption</dt>
            <dd className="m-0">{verdict.softEnvelope.softAssumption}</dd>
          </dl>
        ) : null}

        {verdict.unsatCoreInvariantKeys !== undefined && verdict.unsatCoreInvariantKeys.length > 0 ? (
          <p className={cn("mt-3", OPERATOR_TYPOGRAPHY.body)}>
            Unsat core: {verdict.unsatCoreInvariantKeys.join(", ")}
          </p>
        ) : null}

        {isExportableDecisionVerdict(verdict.kind) ? (
          <div className="mt-4">
            <DecisionReceiptExportButton
              context={{
                source: "committed-run",
                runId: props.runId,
                verdict,
              }}
            />
          </div>
        ) : null}
      </div>

      <TransparencyTrailPanel trail={trail} className="mt-4" />
    </section>
  );
}

import { cn } from "@/lib/utils";
import { InlineGuidance } from "@/components/InlineGuidance";
import type { RunDetailFirstScreenProofSummary } from "@/lib/runs/run-detail-first-screen-proof-status";
import { runDetailFirstScreenProofDispositionClass } from "@/lib/runs/run-detail-first-screen-proof-status";
import { PROOF_CONFIDENCE_FIELD_LABEL } from "@/lib/proof-confidence-taxonomy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type RunDetailFirstScreenProofStatusProps = {
  readonly summary: RunDetailFirstScreenProofSummary;
};

/** First-screen READY/WARN/HOLD proof summary for run detail (Improvement #24). */
export function RunDetailFirstScreenProofStatus(props: RunDetailFirstScreenProofStatusProps): React.JSX.Element {
  const { summary } = props;
  const primaryBullet = summary.whySafeToSendBullets[0] ?? null;
  const detailBullets = summary.whySafeToSendBullets.slice(1);

  return (
    <section
      className={`min-w-0 overflow-visible rounded-lg border px-4 py-3 ${runDetailFirstScreenProofDispositionClass(summary.disposition)}`}
      data-testid="run-detail-first-screen-proof-status"
      aria-label={summary.cardTitle}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{summary.cardTitle}</span>
        <span className={cn("rounded-full border border-current/25 px-2 py-0.5 font-semibold uppercase tracking-wide", OPERATOR_TYPOGRAPHY.badge)}>
          {summary.disposition}
        </span>
      </div>

      {primaryBullet !== null ? (
        <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>{primaryBullet}</p>
      ) : null}

      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
        <InlineGuidance label="Next action:" labelTestId="inline-guidance-next-action">
          {summary.nextAction}
        </InlineGuidance>
      </p>

      <details className="mt-3">
        <summary className={cn("cursor-pointer font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          View proof details
        </summary>
        <div className="mt-3 min-w-0 space-y-3">
          {detailBullets.length > 0 ? (
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {detailBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}

          <dl className={cn("m-0 grid min-w-0 gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className="font-semibold">{PROOF_CONFIDENCE_FIELD_LABEL}</dt>
              <dd className="m-0">{summary.proofConfidenceLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">Execution mode</dt>
              <dd className="m-0">{summary.executionModeLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">Sponsor proof gate</dt>
              <dd className="m-0">{summary.pilotStrictLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">ROI source basis</dt>
              <dd className="m-0">{summary.roiBasisLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">Proof disposition</dt>
              <dd className="m-0">{summary.proofPacketLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold">Governed coverage</dt>
              <dd className="m-0">{summary.governedCoverageLabel}</dd>
            </div>
          </dl>

          {summary.detail ? (
            <p className={cn("m-0 opacity-90", OPERATOR_TYPOGRAPHY.helper)}>{summary.detail}</p>
          ) : null}
        </div>
      </details>
    </section>
  );
}

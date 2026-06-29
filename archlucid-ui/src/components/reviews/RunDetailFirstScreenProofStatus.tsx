import { cn } from "@/lib/utils";
import type { RunDetailFirstScreenProofSummary } from "@/lib/run-detail-first-screen-proof-status";
import { cn } from "@/lib/utils";
import { runDetailFirstScreenProofDispositionClass } from "@/lib/run-detail-first-screen-proof-status";
import { cn } from "@/lib/utils";
import { PROOF_CONFIDENCE_FIELD_LABEL } from "@/lib/proof-confidence-taxonomy";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type RunDetailFirstScreenProofStatusProps = {
  readonly summary: RunDetailFirstScreenProofSummary;
};

/** First-screen READY/WARN/HOLD proof summary for run detail (Improvement #24). */
export function RunDetailFirstScreenProofStatus(props: RunDetailFirstScreenProofStatusProps): React.JSX.Element {
  const { summary } = props;

  return (
    <section
      className={`rounded-lg border px-4 py-3 ${runDetailFirstScreenProofDispositionClass(summary.disposition)}`}
      data-testid="run-detail-first-screen-proof-status"
      aria-label={summary.cardTitle}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{summary.cardTitle}</span>
        <span className={cn("rounded-full border border-current/25 px-2 py-0.5 font-semibold uppercase tracking-wide", OPERATOR_TYPOGRAPHY.badge)}>
          {summary.disposition}
        </span>
      </div>

      <ul className={cn("m-0 mt-3 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
        {summary.whySafeToSendBullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <dl className={cn("m-0 mt-3 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="font-semibold">{PROOF_CONFIDENCE_FIELD_LABEL}</dt>
          <dd className="m-0">{summary.proofConfidenceLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold">Execution mode</dt>
          <dd className="m-0">{summary.executionModeLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold">PilotStrict</dt>
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

      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-semibold">Next action:</span> {summary.nextAction}
      </p>

      {summary.detail ? (
        <p className={cn("m-0 mt-2 opacity-90", OPERATOR_TYPOGRAPHY.helper)}>{summary.detail}</p>
      ) : null}
    </section>
  );
}

import type { RunDetailFirstScreenProofSummary } from "@/lib/run-detail-first-screen-proof-status";
import { runDetailFirstScreenProofDispositionClass } from "@/lib/run-detail-first-screen-proof-status";

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
        <span className="text-sm font-semibold">{summary.cardTitle}</span>
        <span className="rounded-full border border-current/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {summary.disposition}
        </span>
      </div>

      <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-sm">
        {summary.whySafeToSendBullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <dl className="m-0 mt-3 grid gap-2 text-sm sm:grid-cols-2">
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
      </dl>

      <p className="m-0 mt-3 text-sm">
        <span className="font-semibold">Next action:</span> {summary.nextAction}
      </p>

      {summary.detail ? (
        <p className="m-0 mt-2 text-xs opacity-90">{summary.detail}</p>
      ) : null}
    </section>
  );
}

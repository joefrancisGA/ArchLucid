import type { SponsorEvidencePackPayload } from "@/lib/api";
import { formatWhyPageInstant } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";

export type WhyArchLucidSponsorPackBodyProps = {
  readonly sponsorPack: SponsorEvidencePackPayload;
  readonly pct: (ratio: number) => string;
};

export function WhyArchLucidSponsorPackBody(props: WhyArchLucidSponsorPackBodyProps) {
  const { sponsorPack, pct } = props;
  const trace = sponsorPack.explainabilityTrace;
  const gov = sponsorPack.governanceOutcomes;
  const proc = sponsorPack.processInstrumentation;
  const runsTracked =
    typeof proc?.runsCreatedTotal === "number" && Number.isFinite(proc.runsCreatedTotal) ? proc.runsCreatedTotal : 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Generated {formatWhyPageInstant(sponsorPack.generatedUtc)} · demo review{" "}
        <code>{sponsorPack.demoRunId ?? "—"}</code> · telemetry slice matches the process counters ({runsTracked} reviews
        tracked).
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {trace ? (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/60">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Explainability trace</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{pct(trace.overallCompletenessRatio ?? Number.NaN)}</p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              {typeof trace.totalFindings === "number" ? trace.totalFindings : 0} findings in persisted snapshot
            </p>
          </div>
        ) : (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60">
            Explainability trace metrics not present in this bundle.
          </div>
        )}

        {gov ? (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/60">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Governance outcomes</p>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Pending approvals</dt>
                <dd className="tabular-nums font-medium">{gov.pendingApprovalCount ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Recent decisions</dt>
                <dd className="tabular-nums font-medium">{gov.recentTerminalDecisionCount ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Policy pack rows</dt>
                <dd className="tabular-nums font-medium">{gov.recentPolicyPackChangeCount ?? 0}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60">
            Governance outcome counters not present in this bundle.
          </div>
        )}
      </div>

      {sponsorPack.demoRunValueReportDelta ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Value-report delta</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-neutral-500">Wall to commit</dt>
              <dd className="font-mono tabular-nums">
                {sponsorPack.demoRunValueReportDelta.timeToCommittedManifestTotalSeconds != null
                  ? sponsorPack.demoRunValueReportDelta.timeToCommittedManifestTotalSeconds.toFixed(1)
                  : "—"}{" "}
                s
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">LLM calls</dt>
              <dd className="tabular-nums">{sponsorPack.demoRunValueReportDelta.llmCallCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Audit rows</dt>
              <dd className="tabular-nums">
                {sponsorPack.demoRunValueReportDelta.auditRowCount ?? "—"}
                {sponsorPack.demoRunValueReportDelta.auditRowCountTruncated ? "+" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Demo watermark</dt>
              <dd className="text-neutral-700 dark:text-neutral-300">
                {sponsorPack.demoRunValueReportDelta.isDemoTenant ? "Contoso seeded" : "Live tenant"}
              </dd>
            </div>
          </dl>

          {(sponsorPack.demoRunValueReportDelta.findingsBySeverity?.length ?? 0) > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Demo review histogram</p>
              <ul className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {(sponsorPack.demoRunValueReportDelta.findingsBySeverity ?? []).map((row) => (
                  <li
                    key={row.severity}
                    className="rounded border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <span className="font-medium">{row.severity}</span> · {row.count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          Value-report deltas are unavailable until the canonical demo review is present in-scope (seed Contoso Retail or run{" "}
          <code>pilot up</code>).
        </p>
      )}
    </div>
  );
}

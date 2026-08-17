import { cn } from "@/lib/utils";
import type { SponsorEvidencePackPayload } from "@/lib/api";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { formatWhyPageInstant } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";
import {
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_KPI_VALUE,
} from "@/lib/design-tokens";
import {
  WHY_ARCHLUCID_EXPLAINABILITY_COMPLETENESS_CAPTION,
  WHY_ARCHLUCID_SNAPSHOT_REVIEW_ID_LABEL,
  WHY_ARCHLUCID_SPONSOR_PACK_FINDINGS_CAPTION,
  WHY_ARCHLUCID_VALUE_REPORT_DELTA_AUDIT_LABEL,
  WHY_ARCHLUCID_VALUE_REPORT_DELTA_UNAVAILABLE,
} from "@/lib/why-archlucid-page-copy";

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
      <p className={cn("text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>
        Generated {formatWhyPageInstant(sponsorPack.generatedUtc)} ·{" "}
        <TechnicalIdDisclosure label={WHY_ARCHLUCID_SNAPSHOT_REVIEW_ID_LABEL} value={sponsorPack.demoRunId} /> ·
        telemetry slice matches the host process counters ({runsTracked} reviews tracked).
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {trace ? (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
            <p className={OPERATOR_KPI_CARD_TITLE}>Explainability trace</p>
            <p className={cn("mt-2", OPERATOR_KPI_VALUE)}>{pct(trace.overallCompletenessRatio ?? Number.NaN)}</p>
            <p className={cn("mt-1 text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>
              {WHY_ARCHLUCID_EXPLAINABILITY_COMPLETENESS_CAPTION}
            </p>
            <p className={cn("mt-2 text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>
              {typeof trace.totalFindings === "number" ? trace.totalFindings : 0} {WHY_ARCHLUCID_SPONSOR_PACK_FINDINGS_CAPTION.toLowerCase()}
            </p>
          </div>
        ) : (
          <div className={cn("rounded border border-neutral-200 bg-neutral-50 p-3 text-al-text-secondary dark:border-neutral-800 dark:bg-neutral-900/60", OPERATOR_KPI_CARD_DESCRIPTION)}>
            Explainability trace metrics not present in this bundle.
          </div>
        )}

        {gov ? (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
            <p className={OPERATOR_KPI_CARD_TITLE}>Governance outcomes</p>
            <dl className={cn("mt-2 space-y-1", OPERATOR_KPI_CARD_DESCRIPTION)}>
              <div className="flex justify-between gap-2">
                <dt className="text-al-text-secondary">Pending approvals</dt>
                <dd className="font-medium tabular-nums text-al-text-primary">{gov.pendingApprovalCount ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-al-text-secondary">Recent decisions</dt>
                <dd className="font-medium tabular-nums text-al-text-primary">{gov.recentTerminalDecisionCount ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-al-text-secondary">Policy pack rows</dt>
                <dd className="font-medium tabular-nums text-al-text-primary">{gov.recentPolicyPackChangeCount ?? 0}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className={cn("rounded border border-neutral-200 bg-neutral-50 p-3 text-al-text-secondary dark:border-neutral-800 dark:bg-neutral-900/60", OPERATOR_KPI_CARD_DESCRIPTION)}>
            Governance outcome counters not present in this bundle.
          </div>
        )}
      </div>

      {sponsorPack.demoRunValueReportDelta ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <p className={OPERATOR_KPI_CARD_TITLE}>Value-report delta</p>
          <dl className={cn("mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4", OPERATOR_KPI_CARD_DESCRIPTION)}>
            <div>
              <dt className="text-al-text-secondary">Wall to finalize</dt>
              <dd className="font-mono tabular-nums text-al-text-primary">
                {sponsorPack.demoRunValueReportDelta.timeToCommittedManifestTotalSeconds != null
                  ? sponsorPack.demoRunValueReportDelta.timeToCommittedManifestTotalSeconds.toFixed(1)
                  : "—"}{" "}
                s
              </dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">LLM calls</dt>
              <dd className="tabular-nums text-al-text-primary">{sponsorPack.demoRunValueReportDelta.llmCallCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">{WHY_ARCHLUCID_VALUE_REPORT_DELTA_AUDIT_LABEL}</dt>
              <dd className="tabular-nums text-al-text-primary">
                {sponsorPack.demoRunValueReportDelta.auditRowCount ?? "—"}
                {sponsorPack.demoRunValueReportDelta.auditRowCountTruncated ? "+" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Demo watermark</dt>
              <dd className="text-al-text-primary">
                {sponsorPack.demoRunValueReportDelta.isDemoTenant ? "Demo seeded" : "Live tenant"}
              </dd>
            </div>
          </dl>

          {(sponsorPack.demoRunValueReportDelta.findingsBySeverity?.length ?? 0) > 0 ? (
            <div className="mt-3">
              <p className={cn("font-medium text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>Demo review histogram</p>
              <ul className={cn("mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4", OPERATOR_KPI_CARD_DESCRIPTION)}>
                {(sponsorPack.demoRunValueReportDelta.findingsBySeverity ?? []).map((row) => (
                  <li
                    key={row.severity}
                    className="rounded border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <span className="font-medium text-al-text-primary">{row.severity}</span> · {row.count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className={cn("text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>{WHY_ARCHLUCID_VALUE_REPORT_DELTA_UNAVAILABLE}</p>
      )}
    </div>
  );
}

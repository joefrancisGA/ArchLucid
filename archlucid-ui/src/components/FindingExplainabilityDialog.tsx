"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { ExplainabilityTraceTree } from "@/components/explainability/ExplainabilityTraceTree";
import { FindingEvidenceGraph } from "@/components/findings/FindingEvidenceGraphLazy";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { SeverityTag } from "@/components/ui/severity-tag";
import { getFindingExplainability } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  findingRationalePreview,
  findingSeverityAudienceCopy,
  findingTraceCompletenessPlainEnglish,
} from "@/lib/findings/finding-explainability-summary";
import { truncateForList } from "@/lib/truncate-for-list";
import {
  OPERATOR_CALLOUT_WARN_CLASS,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { FindingExplainability } from "@/types/explanation";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

export type FindingExplainabilityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
  findingId: string | null;
};

/**
 * Fetches and displays persisted explainability for one finding (trace fields + server narrative).
 */
export function FindingExplainabilityDialog({
  open,
  onOpenChange,
  runId,
  findingId,
}: FindingExplainabilityDialogProps) {
  const [data, setData] = useState<FindingExplainability | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (findingId === null || findingId.trim().length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);
    setData(null);

    try {
      const body = await getFindingExplainability(runId, findingId.trim());
      setData(body);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [runId, findingId]);

  useEffect(() => {
    if (!open || findingId === null || findingId.trim().length === 0) {
      return;
    }

    void load();
  }, [open, findingId, load]);

  const ratioPct =
    data !== null && Number.isFinite(data.traceCompletenessRatio)
      ? Math.round(Math.min(1, Math.max(0, data.traceCompletenessRatio)) * 100)
      : 0;

  const missingFields = data?.missingTraceFields?.filter((s) => s.trim().length > 0) ?? [];

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const technicalAuditSummary = buyerPolishedShell ? "Technical audit" : "Trace audit";

  const severityInspect =
    data !== null ? findingSeverityAudienceCopy(data.severity) : { meaningForOperators: "", suggestedNext: "" };

  // Suppressed when the persisted narrative only restates the finding title already shown above it.
  const rationalePreview =
    data !== null
      ? findingRationalePreview({
          narrativeText: data.narrativeText,
          conclusion: data.evidence?.conclusion ?? "",
          title: data.title,
          findingId: data.findingId,
        })
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
        aria-labelledby="finding-explainability-dialog-title"
        aria-describedby="finding-explainability-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle id="finding-explainability-dialog-title">Finding explainability</DialogTitle>
          <DialogDescription id="finding-explainability-dialog-desc">
            {buyerPolishedShell
              ? "Structured reasoning captured when this finding was produced."
              : "Deterministic pipeline trace loaded here — external cloud completions appear only when the workspace routes execution through live endpoints."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <OperatorLoadingNotice>
            <strong>Loading explainability…</strong>
          </OperatorLoadingNotice>
        ) : null}

        {failure !== null ? (
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
            httpStatus={failure.httpStatus}
            retryAfterSeconds={failure.retryAfterSeconds}
          />
        ) : null}

        {!loading && failure === null && data !== null ? (
          <div className={cn("space-y-4 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)} title={data.title}>
              {truncateForList(data.title, 280)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityTag severity={data.severity} />
              <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{data.engineType}</span>
            </div>

            <section
              aria-labelledby="finding-inspect-summary-heading"
              className={cn(
                "rounded-md border border-neutral-200 bg-neutral-50/90 p-3 leading-relaxed text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              <h3 id="finding-inspect-summary-heading" className={cn("m-0 font-semibold text-neutral-600 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
                Why this finding was created
              </h3>
              {rationalePreview !== null ? (
                <p className={cn("m-0 mt-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                  {truncateForList(rationalePreview, 260)}
                </p>
              ) : null}
              <p className={cn("m-0 mt-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                <span className="font-semibold">Severity:</span> {severityInspect.meaningForOperators}
              </p>
              <p className={cn("m-0 mt-1.5 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                <span className="font-semibold">Suggested next step:</span> {severityInspect.suggestedNext}
              </p>
              <p className={cn("m-0 mt-1.5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
                <span className="font-semibold">Evidence completeness:</span> {findingTraceCompletenessPlainEnglish(ratioPct)}
              </p>
            </section>

            <ExplainabilityTraceTree data={data} />

            {data.graphNodeIdsExamined.length > 0 ? (
              <section
                aria-labelledby="finding-evidence-graph-heading"
                className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950/40"
              >
                <h3
                  id="finding-evidence-graph-heading"
                  className={cn("m-0 mb-2 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
                >
                  Evidence graph
                </h3>
                <FindingEvidenceGraph runId={runId} graphNodeIdsExamined={data.graphNodeIdsExamined} />
              </section>
            ) : null}

            <details className="group rounded-md border border-neutral-200 bg-white p-0 dark:border-neutral-700 dark:bg-neutral-950/40">
              <summary className={cn(
                "cursor-pointer select-none rounded-md px-3 py-2 font-semibold text-neutral-900 marker:text-neutral-400 dark:text-neutral-100",
                OPERATOR_DISCLOSURE_TRIGGER_CLASS,
              )}>
                {technicalAuditSummary}
              </summary>
              <div className="space-y-4 border-t border-neutral-200 px-3 py-3 dark:border-neutral-700">
                <div className={cn("flex flex-wrap items-center gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  <span>Finding id</span>
                  <Badge variant="outline" className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {data.findingId}
                  </Badge>
                </div>
                {data.evidence ? (
                  <section aria-labelledby="finding-evidence-heading" className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-3">
                    <h3 id="finding-evidence-heading" className={cn("mb-2 font-semibold text-sky-950 dark:text-sky-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {buyerPolishedShell ? "Structured evidence" : "Structured evidence (deterministic)"}
                    </h3>
                    <dl className={cn("m-0 space-y-2 text-sky-950 dark:text-sky-50", OPERATOR_TYPOGRAPHY.helper)}>
                      <div>
                        <dt className="font-semibold text-sky-900 dark:text-sky-200">Rule id</dt>
                        <dd className="m-0 font-mono">{data.evidence.ruleId}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-sky-900 dark:text-sky-200">Conclusion (from finding rationale)</dt>
                        <dd className="m-0 whitespace-pre-wrap leading-relaxed">{data.evidence.conclusion}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-sky-900 dark:text-sky-200">Evidence refs</dt>
                        <dd className="m-0">
                          {data.evidence.evidenceRefs.length === 0 ? (
                            <span className="text-sky-800/80 dark:text-sky-200/80">None recorded</span>
                          ) : (
                            <ul className="m-0 list-disc space-y-0.5 pl-5">
                              {data.evidence.evidenceRefs.map((ref, i) => (
                                <li key={`${ref}-${i}`} className="font-mono">
                                  {ref}
                                </li>
                              ))}
                            </ul>
                          )}
                        </dd>
                      </div>
                      {data.evidence.alternativePathsConsidered.length > 0 ? (
                        <div>
                          <dt className="font-semibold text-sky-900 dark:text-sky-200">Alternative paths (structured)</dt>
                          <dd className="m-0">
                            <ul className="m-0 list-disc space-y-0.5 pl-5">
                              {data.evidence.alternativePathsConsidered.map((a, i) => (
                                <li key={`${a}-${i}`}>{a}</li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </section>
                ) : null}
                <div className="space-y-1">
                  <div className={cn("flex items-center justify-between gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    <span>Trace completeness</span>
                    <span>{ratioPct}%</span>
                  </div>
                  <Progress
                    value={ratioPct}
                    className="h-2"
                    aria-label={`Trace completeness ${ratioPct} percent`}
                  />
                </div>
                {missingFields.length > 0 ? (
                  <section
                    aria-label="Missing trace fields"
                    className={cn("rounded-md p-3", OPERATOR_CALLOUT_WARN_CLASS)}
                  >
                    <p className="m-0 font-semibold">Not populated in trace</p>
                    <ul className="m-0 mt-1 list-disc space-y-0.5 pl-5">
                      {missingFields.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {data.narrativeText.trim().length > 0 ? (
                  <section aria-labelledby="finding-narrative-heading">
                    <h3 id="finding-narrative-heading" className={cn("mb-1 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      Narrative (presentation)
                    </h3>
                    <p className="m-0 whitespace-pre-wrap leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {data.narrativeText}
                    </p>
                  </section>
                ) : null}
                {data.rulesApplied.length > 0 ? (
                  <section>
                    <h3 className={cn("mb-1 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Rules applied</h3>
                    <ul className="m-0 list-disc space-y-0.5 pl-5">
                      {data.rulesApplied.map((r, i) => (
                        <li key={`${r}-${i}`}>{r}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {data.decisionsTaken.length > 0 ? (
                  <section>
                    <h3 className={cn("mb-1 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Decisions taken</h3>
                    <ol className="m-0 list-decimal space-y-0.5 pl-5">
                      {data.decisionsTaken.map((d, i) => (
                        <li key={`${d}-${i}`}>{d}</li>
                      ))}
                    </ol>
                  </section>
                ) : null}
                {data.graphNodeIdsExamined.length > 0 ? (
                  <section>
                    <h3 className={cn("mb-1 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Graph nodes examined</h3>
                    <div className="flex flex-wrap gap-1">
                      {data.graphNodeIdsExamined.map((nid, i) => (
                        <Badge key={`${nid}-${i}`} variant="outline" className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                          {nid}
                        </Badge>
                      ))}
                    </div>
                  </section>
                ) : null}
                {data.alternativePathsConsidered.length > 0 ? (
                  <section className={cn("rounded-md p-3", OPERATOR_CALLOUT_WARN_CLASS)}>
                    <h3 className={cn("mb-1 font-semibold text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Alternative paths considered</h3>
                    <ul className="m-0 list-disc space-y-0.5 pl-5 text-amber-950 dark:text-amber-50">
                      {data.alternativePathsConsidered.map((a, i) => (
                        <li key={`${a}-${i}`}>{a}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {data.notes.length > 0 ? (
                  <section>
                    <h3 className={cn("mb-1 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Notes</h3>
                    <ul className="m-0 list-disc space-y-0.5 pl-5">
                      {data.notes.map((n, i) => (
                        <li key={`${n}-${i}`}>{n}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {findingId !== null && findingId.trim().length > 0 ? (
                  <FindingExplainPanel
                    runId={runId}
                    findingId={findingId.trim()}
                    confidenceLevel={data.confidenceLevel ?? null}
                  />
                ) : null}
              </div>
            </details>

            <div className="flex justify-end border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

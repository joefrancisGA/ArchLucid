import { diagnosticAgentEvaluationPerspective } from "@/lib/agent-evaluation-perspective";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AgentEvidenceFaithfulnessBadge } from "@/components/AgentEvidenceFaithfulnessBadge";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { RunToolInvocationForensicsPanel } from "@/components/runs/RunToolInvocationForensicsPanel";
import { EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER } from "@/lib/agent-evidence-faithfulness-presenter";
import { buildAgentTraceRawSnapshotByTraceId } from "@/lib/agent-trace-raw-snapshot";
import { getRunAgentEvaluation, getRunTraces, getRunToolInvocationForensics } from "@/lib/api";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type {
  AgentExecutionTraceListPayload,
  AgentOutputEvaluationScoreRow,
  AgentOutputEvaluationSummaryPayload,
  RunToolInvocationForensicsPayload,
} from "@/types/agent-forensics";

function scoreForTrace(
  scores: AgentOutputEvaluationScoreRow[] | undefined,
  traceId: string,
): AgentOutputEvaluationScoreRow | undefined {
  return scores?.find((s) => s.traceId === traceId);
}

function ratioText(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return " — ";

  return value.toFixed(2);
}

function wallClockDeltaFromPriorAgent(prevIso: string | null, curIso: string): string {
  if (!prevIso) {
    return " — ";
  }

  const prevMs = Date.parse(prevIso);
  const curMs = Date.parse(curIso);

  if (!Number.isFinite(prevMs) || !Number.isFinite(curMs) || curMs < prevMs) {
    return " — ";
  }

  const sec = Math.round((curMs - prevMs) / 1000);

  if (sec < 60) {
    return `${sec}s`;
  }

  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m}m ${s}s`;
}

/** Tooltip: aligns with OTel `archlucid_agent_output_semantic_score` — heuristic / optional judge, not embeddings or truth. */
const semanticOverallTooltip =
  "0–1 overall semantic score (same as telemetry archlucid_agent_output_semantic_score): deterministic checks on claims and findings in persisted JSON, optionally combined with an LLM rubric when enabled. Not embedding similarity and not a guarantee of factual correctness.";

/** Baseline heuristic before optional LLM judge overlay (see server-side CompositeAgentOutputSemanticEvaluator). */
const heuristicColumnTooltip =
  "Heuristic-only 0–1 score: claim evidence coverage and finding field completeness from persisted JSON (before any LLM judge blend).";

/** Optional server-side model rubric column — distinct from heuristic and from embedding faithfulness metrics. */
const llmRubricColumnTooltip =
  "Optional LLM judge score when enabled server-side. Separate from the heuristic and from embedding-cosine faithfulness (a different metric when enabled).";

const notesPreviewMax = 72;

function ForensicsTableHeaderLabel(props: { readonly label: string; readonly hint: string }): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{props.label}</span>
      <FieldHelpTooltip label={props.label} hint={props.hint} />
    </span>
  );
}

function notesPreview(full: string | null | undefined): { text: string } {
  const s = full?.trim() ?? "";

  if (s.length === 0)
    return { text: " — " };

  if (s.length <= notesPreviewMax)
    return { text: s };

  return { text: `${s.slice(0, notesPreviewMax)}…` };
}

function averageEvidenceGroundingRatio(scores: AgentOutputEvaluationScoreRow[] | undefined): number | null {
  const nums: number[] = [];
  for (const row of scores ?? []) {
    const raw = row.semantic?.agentResultFaithfulnessSupportRatio;

    if (raw === null || raw === undefined)
      continue;

    const n = typeof raw === "number" ? raw : Number(raw);

    if (!Number.isFinite(n))
      continue;

    nums.push(n);
  }

  if (nums.length === 0)
    return null;

  return nums.reduce((acc, v) => acc + v, 0) / nums.length;
}

function EvaluationSummaryFooter(props: {
  evaluationPayload: AgentOutputEvaluationSummaryPayload;
  semanticOverallTooltip: string;
}) {
  const { evaluationPayload, semanticOverallTooltip } = props;
  const perspective = diagnosticAgentEvaluationPerspective(evaluationPayload);
  const avgGrounding = averageEvidenceGroundingRatio(perspective?.scores);

  if (!perspective)
    return null;

  return (
    <p className={cn("mt-3 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
      Evaluated at {formatInstantForLocale(evaluationPayload.evaluatedAtUtc)} · skipped traces:{" "}
      {perspective.tracesSkippedCount}
      {perspective.averageStructuralCompletenessRatio !== null &&
      perspective.averageStructuralCompletenessRatio !== undefined
        ? ` · avg structural: ${perspective.averageStructuralCompletenessRatio.toFixed(2)}`
        : ""}
      {perspective.averageSemanticScore !== null &&
      perspective.averageSemanticScore !== undefined ? (
        <>
          {" "}
          · avg semantic: {perspective.averageSemanticScore.toFixed(2)}
          <FieldHelpTooltip label="Average semantic score" hint={semanticOverallTooltip} />
        </>
      ) : null}
      {avgGrounding !== null ? (
        <>
          {" "}
          · avg evidence grounding: {avgGrounding.toFixed(2)}
          <FieldHelpTooltip
            label="Average evidence grounding"
            hint={EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER}
          />
        </>
      ) : null}
    </p>
  );
}

/** Server fragment: architecture-run LLM traces, blob-upload warnings, and on-demand structural evaluation scores. */
export async function RunAgentForensicsSection(props: { runId: string }) {
  const { runId } = props;
  let tracesPayload: AgentExecutionTraceListPayload | null = null;
  let tracesFailure: ApiLoadFailureState | null = null;
  let evaluationPayload: AgentOutputEvaluationSummaryPayload | null = null;
  let evaluationFailure: ApiLoadFailureState | null = null;
  let toolInvocationPayload: RunToolInvocationForensicsPayload | null = null;
  try {
    tracesPayload = (await getRunTraces(runId, 1, 100)).data;
  } catch (e) {
    tracesFailure = toApiLoadFailure(e);
  }

  try {
    evaluationPayload = (await getRunAgentEvaluation(runId)).data;
  } catch (e) {
    evaluationFailure = toApiLoadFailure(e);
  }

  try {
    toolInvocationPayload = (await getRunToolInvocationForensics(runId)).data;
  } catch {
    toolInvocationPayload = null;
  }

  const evaluationPerspective = diagnosticAgentEvaluationPerspective(evaluationPayload);

  const tracesRaw = tracesPayload?.traces ?? [];
  const traces = [...tracesRaw].sort(
    (a, b) => Date.parse(a.createdUtc) - Date.parse(b.createdUtc),
  );
  const blobPersistFailed = traces.some((t) => t.blobUploadFailed === true);
  const toolInvocationRows = toolInvocationPayload?.rows ?? [];
  const traceRawByTraceId = buildAgentTraceRawSnapshotByTraceId(traces);

  return (
    <section id="agent-forensics" className="scroll-mt-24 mb-6" aria-label="Diagnostics — agent traces">
      <CollapsibleSection title="Advanced — agent traces and structural evaluation (diagnostics)" defaultOpen={false}>
      <p className={cn("mt-0 max-w-3xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Prompt/response audit rows plus on-demand structural and semantic scoring of persisted agent JSON. Semantic columns and
        backend histogram <code className={OPERATOR_TYPOGRAPHY.helper}>archlucid_agent_output_semantic_score</code> are{" "}
        <strong className="font-medium text-neutral-600 dark:text-neutral-300">heuristic completeness signals</strong> (and an
        optional LLM rubric when enabled) — not embedding similarity and not proof that recommendations are factually correct.
        The <strong className="font-medium text-neutral-600 dark:text-neutral-300">Evidence grounding</strong> column is a
        separate deterministic signal (token and evidence-reference overlap vs the bundle). Requires architecture API access; empty results are normal when tracing is disabled or the run has no agent steps yet.
      </p>

      <RunToolInvocationForensicsPanel
        hasTraceBlobPersistenceFailure={blobPersistFailed}
        completenessDisclaimer={
          toolInvocationPayload?.completenessDisclaimer ??
          "Structured tool-call rows are not recorded for this review."
        }
        rows={toolInvocationRows}
        traceRawByTraceId={traceRawByTraceId}
      />

      {blobPersistFailed ? (
        <div
          role="status"
          aria-live="polite"
          className={cn("mb-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 px-3 py-2.5", OPERATOR_TYPOGRAPHY.body)}
        >
          <strong>Blob persistence warning:</strong> at least one trace row has{" "}
          <code>blobUploadFailed=true</code> (full prompt/response blobs may be missing). See{" "}
          <code>docs/AGENT_TRACE_FORENSICS.md</code> and durable audit{" "}
          <code>AgentTraceBlobPersistenceFailed</code> when inline persistence exhausts retries or times out.
        </div>
      ) : null}

      {tracesFailure ? (
        <>
          <p className={cn("mb-2 font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>Traces could not be loaded.</p>
          <OperatorApiProblem
            problem={tracesFailure.problem}
            fallbackMessage={tracesFailure.message}
            correlationId={tracesFailure.correlationId}
            variant="warning"
          />
        </>
      ) : null}

      {evaluationFailure ? (
        <>
          <p className={cn("mb-2 mt-3 font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>
            On-demand evaluation could not be loaded.
          </p>
          <OperatorApiProblem
            problem={evaluationFailure.problem}
            fallbackMessage={evaluationFailure.message}
            correlationId={evaluationFailure.correlationId}
            variant="warning"
          />
        </>
      ) : null}

      {!tracesFailure && traces.length === 0 ? (
        <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          No execution traces in the first page of results — expand when troubleshooting ingestion or agent steps.
        </p>
      ) : null}

      {!tracesFailure && traces.length > 0 ? (
        <EnterpriseTable ariaLabel="Agent execution traces" className={OPERATOR_TYPOGRAPHY.body}>
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Agent</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Model alias</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Wall Δ (prior agent)</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Trace ID</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Parse OK</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Blob upload</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Structural</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>
                <ForensicsTableHeaderLabel label="Semantic overall" hint={semanticOverallTooltip} />
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>
                <ForensicsTableHeaderLabel label="Heuristic" hint={heuristicColumnTooltip} />
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>
                <ForensicsTableHeaderLabel label="LLM rubric" hint={llmRubricColumnTooltip} />
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell className="min-w-[8.5rem]">
                <ForensicsTableHeaderLabel
                  label="Evidence grounding"
                  hint={EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER}
                />
              </EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell className="min-w-[11rem]">Judge notes</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {traces.map((t, index) => {
              const sc = scoreForTrace(evaluationPerspective?.scores, t.traceId);
              const sem = sc?.semantic;
              const rawNotes = notesPreview(sem?.llmJudgeNotes);
              const prevCreated =
                index > 0 ? traces[index - 1]!.createdUtc : null;

              return (
                <EnterpriseTableRow key={t.traceId}>
                  <EnterpriseTableCell className="whitespace-nowrap">{buyerLabelForAgentType(t.agentType)}</EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap font-mono text-neutral-600 dark:text-neutral-400">
                    {t.modelAlias?.trim() ? t.modelAlias : " — "}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                    {wallClockDeltaFromPriorAgent(prevCreated, t.createdUtc)}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>{t.traceId}</EnterpriseTableCell>
                  <EnterpriseTableCell>{t.parseSucceeded ? "yes" : "no"}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    {t.blobUploadFailed === true ? "failed" : t.blobUploadFailed === false ? "ok" : " — "}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    {sc
                      ? sc.isJsonParseFailure
                        ? "parse failure"
                        : sc.structuralCompletenessRatio.toFixed(2)
                      : evaluationFailure
                        ? " — "
                        : "n/a"}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">
                    {!sc || evaluationFailure
                      ? " — "
                      : sc.isJsonParseFailure
                        ? " — "
                        : sem
                          ? ratioText(sem.overallSemanticScore)
                          : "n/a"}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">
                    {!sc || evaluationFailure || sc.isJsonParseFailure || !sem
                      ? " — "
                      : ratioText(sem.heuristicOverallScore)}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">
                    {!sc || evaluationFailure || sc.isJsonParseFailure || !sem
                      ? " — "
                      : ratioText(
                          sem.llmJudgeOverallQuality !== null &&
                            sem.llmJudgeOverallQuality !== undefined
                            ? sem.llmJudgeOverallQuality
                            : null,
                        )}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="align-middle">
                    {!sc || evaluationFailure || sc.isJsonParseFailure || !sem ? (
                      " — "
                    ) : (
                      <AgentEvidenceFaithfulnessBadge ratio={sem.agentResultFaithfulnessSupportRatio} />
                    )}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell
                    className={cn("max-w-[14rem] break-words text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                  >
                    {!sc || evaluationFailure || sc.isJsonParseFailure || !sem ? " — " : rawNotes.text}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>
      ) : null}

      {evaluationPayload && !evaluationFailure ? (
        <EvaluationSummaryFooter
          evaluationPayload={evaluationPayload}
          semanticOverallTooltip={semanticOverallTooltip}
        />
      ) : null}
      </CollapsibleSection>
    </section>
  );
}

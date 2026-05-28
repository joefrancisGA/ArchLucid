import { AgentEvidenceFaithfulnessBadge } from "@/components/AgentEvidenceFaithfulnessBadge";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunRetrievalGroundingPanel } from "@/components/RunRetrievalGroundingPanel";
import { RunToolInvocationForensicsPanel } from "@/components/RunToolInvocationForensicsPanel";
import { EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER } from "@/lib/agent-evidence-faithfulness-presenter";
import { getRunAgentEvaluation, getRunRetrievalGrounding, getRunTraces } from "@/lib/api";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type {
  AgentExecutionTraceListPayload,
  AgentOutputEvaluationScoreRow,
  AgentOutputEvaluationSummaryPayload,
  RunRetrievalGroundingPayload,
} from "@/types/agent-forensics";

function agentTypeLabel(agentType: number): string {
  switch (agentType) {
    case 1:
      return "Topology";
    case 2:
      return "Cost";
    case 3:
      return "Compliance";
    case 4:
      return "Critic";
    default:
      return `AgentType(${agentType})`;
  }
}

function scoreForTrace(
  scores: AgentOutputEvaluationScoreRow[] | undefined,
  traceId: string,
): AgentOutputEvaluationScoreRow | undefined {
  return scores?.find((s) => s.traceId === traceId);
}

function ratioText(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return "—";

  return value.toFixed(2);
}

function wallClockDeltaFromPriorAgent(prevIso: string | null, curIso: string): string {
  if (!prevIso) {
    return "—";
  }

  const prevMs = Date.parse(prevIso);
  const curMs = Date.parse(curIso);

  if (!Number.isFinite(prevMs) || !Number.isFinite(curMs) || curMs < prevMs) {
    return "—";
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

function notesPreview(full: string | null | undefined): { text: string; title?: string } {
  const s = full?.trim() ?? "";

  if (s.length === 0)
    return { text: "—" };

  if (s.length <= notesPreviewMax)
    return { text: s };

  return { text: `${s.slice(0, notesPreviewMax)}…`, title: s };
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
  const avgGrounding = averageEvidenceGroundingRatio(evaluationPayload.scores);

  return (
    <p className="mt-3 text-[13px] text-neutral-500 dark:text-neutral-400">
      Evaluated at {formatInstantForLocale(evaluationPayload.evaluatedAtUtc)} · skipped traces:{" "}
      {evaluationPayload.tracesSkippedCount}
      {evaluationPayload.averageStructuralCompletenessRatio !== null &&
      evaluationPayload.averageStructuralCompletenessRatio !== undefined
        ? ` · avg structural: ${evaluationPayload.averageStructuralCompletenessRatio.toFixed(2)}`
        : ""}
      {evaluationPayload.averageSemanticScore !== null &&
      evaluationPayload.averageSemanticScore !== undefined ? (
        <>
          {" "}
          ·{" "}
          <span
            className="cursor-help underline decoration-dotted decoration-neutral-400"
            title={semanticOverallTooltip}
          >
            avg semantic: {evaluationPayload.averageSemanticScore.toFixed(2)}
          </span>
        </>
      ) : null}
      {avgGrounding !== null ? (
        <>
          {" "}
          ·{" "}
          <span
            className="cursor-help underline decoration-dotted decoration-neutral-400"
            title={EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER}
          >
            avg evidence grounding: {avgGrounding.toFixed(2)}
          </span>
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
  let retrievalGroundingPayload: RunRetrievalGroundingPayload | null = null;
  let retrievalGroundingFailure: ApiLoadFailureState | null = null;

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
    retrievalGroundingPayload = (await getRunRetrievalGrounding(runId)).data;
  } catch (e) {
    retrievalGroundingFailure = toApiLoadFailure(e);
  }

  const tracesRaw = tracesPayload?.traces ?? [];
  const traces = [...tracesRaw].sort(
    (a, b) => Date.parse(a.createdUtc) - Date.parse(b.createdUtc),
  );
  const blobPersistFailed = traces.some((t) => t.blobUploadFailed === true);


  return (
    <section id="agent-forensics" className="scroll-mt-24 mb-6" aria-label="Diagnostics — agent traces">
      <CollapsibleSection title="Advanced — agent traces and structural evaluation (diagnostics)" defaultOpen={false}>
      <p className="mt-0 max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">
        Prompt/response audit rows plus on-demand structural and semantic scoring of persisted agent JSON. Semantic columns and
        backend histogram <code className="text-xs">archlucid_agent_output_semantic_score</code> are{" "}
        <strong className="font-medium text-neutral-600 dark:text-neutral-300">heuristic completeness signals</strong> (and an
        optional LLM rubric when enabled) — not embedding similarity and not proof that recommendations are factually correct.
        The <strong className="font-medium text-neutral-600 dark:text-neutral-300">Evidence grounding</strong> column is a
        separate deterministic signal (token and evidence-reference overlap vs the bundle). Requires architecture API access; empty results are normal when tracing is disabled or the run has no agent steps yet.
      </p>

      <RunRetrievalGroundingPanel
        payload={retrievalGroundingPayload}
        failure={retrievalGroundingFailure}
      />

      <RunToolInvocationForensicsPanel hasTraceBlobPersistenceFailure={blobPersistFailed} />

      {blobPersistFailed ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <strong>Blob persistence warning:</strong> at least one trace row has{" "}
          <code>blobUploadFailed=true</code> (full prompt/response blobs may be missing). See{" "}
          <code>docs/AGENT_TRACE_FORENSICS.md</code> and durable audit{" "}
          <code>AgentTraceBlobPersistenceFailed</code> when inline persistence exhausts retries or times out.
        </div>
      ) : null}

      {tracesFailure ? (
        <>
          <p className="mb-2 text-sm font-semibold">Traces could not be loaded.</p>
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
          <p className="mb-2 mt-3 text-sm font-semibold">
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
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No execution traces in the first page of results — expand when troubleshooting ingestion or agent steps.
        </p>
      ) : null}

      {!tracesFailure && traces.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left dark:border-neutral-700">
                <th className="px-1.5 py-2">Agent</th>
                <th className="px-1.5 py-2">Wall Δ (prior agent)</th>
                <th className="px-1.5 py-2">Trace ID</th>
                <th className="px-1.5 py-2">Parse OK</th>
                <th className="px-1.5 py-2">Blob upload</th>
                <th className="px-1.5 py-2">Structural</th>
                <th className="px-1.5 py-2" title={semanticOverallTooltip}>
                  Semantic overall
                </th>
                <th className="px-1.5 py-2" title={heuristicColumnTooltip}>
                  Heuristic
                </th>
                <th className="px-1.5 py-2" title={llmRubricColumnTooltip}>
                  LLM rubric
                </th>
                <th className="px-1.5 py-2 min-w-[8.5rem]" title={EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER}>
                  Evidence grounding
                </th>
                <th className="px-1.5 py-2 min-w-[11rem]">Judge notes</th>
              </tr>
            </thead>
            <tbody>
              {traces.map((t, index) => {
                const sc = scoreForTrace(evaluationPayload?.scores, t.traceId);
                const sem = sc?.semantic;
                const rawNotes = notesPreview(sem?.llmJudgeNotes);
                const prevCreated =
                  index > 0 ? traces[index - 1]!.createdUtc : null;

                return (
                  <tr key={t.traceId} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="whitespace-nowrap px-1.5 py-2">{agentTypeLabel(t.agentType)}</td>
                    <td className="whitespace-nowrap px-1.5 py-2 text-neutral-600 dark:text-neutral-400">
                      {wallClockDeltaFromPriorAgent(prevCreated, t.createdUtc)}
                    </td>
                    <td className="px-1.5 py-2 font-mono text-xs">{t.traceId}</td>
                    <td className="px-1.5 py-2">{t.parseSucceeded ? "yes" : "no"}</td>
                    <td className="px-1.5 py-2">
                      {t.blobUploadFailed === true ? "failed" : t.blobUploadFailed === false ? "ok" : "—"}
                    </td>
                    <td className="px-1.5 py-2">
                      {sc
                        ? sc.isJsonParseFailure
                          ? "parse failure"
                          : sc.structuralCompletenessRatio.toFixed(2)
                        : evaluationFailure
                          ? "—"
                          : "n/a"}
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-2">
                      {!sc || evaluationFailure
                        ? "—"
                        : sc.isJsonParseFailure
                          ? "—"
                          : sem
                            ? ratioText(sem.overallSemanticScore)
                            : "n/a"}
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-2">
                      {!sc || evaluationFailure || sc.isJsonParseFailure || !sem
                        ? "—"
                        : ratioText(sem.heuristicOverallScore)}
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-2">
                      {!sc || evaluationFailure || sc.isJsonParseFailure || !sem
                        ? "—"
                        : ratioText(
                            sem.llmJudgeOverallQuality !== null &&
                              sem.llmJudgeOverallQuality !== undefined
                              ? sem.llmJudgeOverallQuality
                              : null,
                          )}
                    </td>
                    <td className="px-1.5 py-2 align-middle">
                      {!sc || evaluationFailure || sc.isJsonParseFailure || !sem ? (
                        "—"
                      ) : (
                        <AgentEvidenceFaithfulnessBadge ratio={sem.agentResultFaithfulnessSupportRatio} />
                      )}
                    </td>
                    <td
                      className="max-w-[14rem] truncate px-1.5 py-2 text-xs text-neutral-600 dark:text-neutral-400"
                      title={rawNotes.title ?? (rawNotes.text === "—" ? undefined : rawNotes.text)}
                    >
                      {!sc || evaluationFailure || sc.isJsonParseFailure || !sem ? "—" : rawNotes.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

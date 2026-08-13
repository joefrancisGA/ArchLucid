using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Agent handler degradation and explanation LLM schema/faithfulness telemetry.</summary>
/// <remarks>
///     Instrument field declarations for this subsystem live in this partial.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    // Instrument catalog

    
    /// <summary>
    ///     Execute retry skipped handler dispatch because a persisted non-degraded result exists (labels:
    ///     <c>agent_type</c>, <c>reason</c>).
    /// </summary>
    public static readonly Counter<long> AgentExecuteTaskSkippedIdempotentTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_execute_task_skipped_idempotent_total",
            description: "Agent execute retry skipped handler dispatch for idempotent task (labels: agent_type, reason).");

    
    /// <summary>
    ///     Staged Critic batch phases in <c>RealAgentExecutor</c> (labels: <c>phase</c>=phase1|phase2, <c>outcome</c>).
    /// </summary>
    public static readonly Histogram<double> AgentExecutionStagedCriticPhaseDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_execution_staged_critic_phase_duration_ms",
            "ms",
            "Staged Critic batch phase wall time in RealAgentExecutor (labels: phase=phase1|phase2, outcome).");

    
    /// <summary>
    ///     Embedding faithfulness cosine score for agent output evaluation (0–1; label <c>agent_type</c>) when
    ///     <c>ArchLucid:Agents:Faithfulness:EmbeddingEnabled</c> is true.
    /// </summary>
    public static readonly Histogram<double> AgentFaithfulnessCosine =
        AppMeter.CreateHistogram<double>(
            "archlucid.agent.faithfulness_cosine",
            description: "Embedding faithfulness cosine similarity for agent JSON vs evidence (0-1).");

    
    /// <summary>
    ///     Non-Critic handler resilience fallbacks that returned a degraded placeholder (labels: <c>agent_type_key</c>,
    ///     <c>degradation_reason</c>).
    /// </summary>
    public static readonly Counter<long> AgentHandlerDegradationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_handler_degradations_total",
            description: "Non-Critic agent handler degraded fallbacks (labels: agent_type_key, degradation_reason).");

    
    /// <summary>Production agent handler completions (label: <c>agent_type_key</c>, <c>outcome</c>=success|error|degraded).</summary>
    public static readonly Counter<long> AgentHandlerInvocationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_handler_invocations_total",
            description: "Agent handler invocations by type and outcome.");

    
    /// <summary>
    ///     AgentResult embedding faithfulness mean cosine vs evidence (clamped 0–1 for telemetry; label <c>agent_type</c>) when
    ///     embedding scorer runs.
    /// </summary>
    public static readonly Histogram<double> AgentOutputEmbeddingFaithfulnessMeanCosine =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_embedding_faithfulness_mean_cosine",
            description: "Mean cosine similarity between claims/findings and evidence chunks (0-1 clamp).");

    
    /// <summary>Absolute delta between LLM judge median score and heuristic semantic score (label <c>agent_type</c>).</summary>
    public static readonly Histogram<double> AgentOutputJudgeDisagreement =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_judge_disagreement",
            description: "LLM judge vs heuristic semantic disagreement magnitude (0-1).");

    
    /// <summary>
    ///     LLM faithfulness score comparing agent JSON against evidence chunks (0–1; label <c>agent_type</c>) when enabled.
    /// </summary>
    public static readonly Histogram<double> AgentOutputLlmFaithfulnessScore =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_llm_faithfulness_score",
            description: "LLM faithfulness score vs run evidence package (0-1).");

    
    /// <summary>
    ///     Trace JSON that is not a JSON object or failed <see cref="System.Text.Json" /> parse (label <c>agent_type</c>
    ///     ).
    /// </summary>
    public static readonly Counter<long> AgentOutputParseFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_output_parse_failures_total",
            description: "Agent trace ParsedResultJson parse/root-kind failures.");

    
    /// <summary>
    ///     Quality gate outcomes after structural + semantic evaluation (labels: <c>agent_type</c>, <c>outcome</c>
    ///     =accepted|warned|rejected, <c>gate_mode</c>, <c>reject_reason</c>, <c>execution_mode</c>).
    /// </summary>
    public static readonly Counter<long> AgentOutputQualityGateTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_output_quality_gate_total",
            description:
            "Agent output quality gate outcomes (labels: agent_type, outcome, gate_mode, reject_reason, execution_mode).");

    
    /// <summary>Reference-case evaluation outcomes (labels: <c>case_id</c>, <c>agent_type</c>, <c>outcome</c>=pass|fail).</summary>
    public static readonly Counter<long> AgentOutputReferenceCaseEvaluationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_output_reference_case_evaluations_total",
            description: "Reference-case agent output evaluations (labels: case_id, agent_type, outcome=pass|fail).");

    
    /// <summary>
    ///     Mean of structural completeness and semantic score for each reference-case evaluation (labels: <c>case_id</c>,
    ///     <c>agent_type</c>).
    /// </summary>
    public static readonly Histogram<double> AgentOutputReferenceCaseScoreRatio =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_reference_case_score_ratio",
            description: "Combined reference-case score (structural+semantic)/2 (0.0–1.0).");

    
    /// <summary>
    ///     Distribution of <c>OverallSemanticScore</c> (0–1; label <c>agent_type</c>): deterministic heuristic checks on
    ///     persisted agent JSON (claim evidence refs, finding field completeness), optionally combined with an LLM rubric when
    ///     enabled — <b>not</b> embedding cosine similarity nor a guarantee of factual correctness. For optional embedding
    ///     alignment telemetry see <see cref="AgentOutputEmbeddingFaithfulnessMeanCosine" />.
    /// </summary>
    public static readonly Histogram<double> AgentOutputSemanticScore =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_semantic_score",
            description:
            "OverallSemanticScore (0-1): heuristic JSON-structure quality (claims/findings), optionally with LLM judge — not embeddings or ground truth.");

    
    /// <summary>
    ///     Fraction of expected <c>AgentResult</c> JSON keys present on <c>ParsedResultJson</c> (0.0–1.0; label
    ///     <c>agent_type</c>).
    /// </summary>
    public static readonly Histogram<double> AgentOutputStructuralCompletenessRatio =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_structural_completeness_ratio",
            description: "Structural completeness of persisted agent parsed JSON (0.0–1.0).");

    
    /// <summary>Wall-clock milliseconds to complete agent trace full-text blob persistence (label <c>agent_type</c>).</summary>
    public static readonly Histogram<double> AgentTraceBlobPersistDurationMs =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_trace_blob_persist_duration_ms",
            "ms",
            "Duration in milliseconds for full prompt/response blob writes per trace.");

    
    /// <summary>Total failed agent trace blob uploads after all retries (labels: <c>agent_type</c>, <c>blob_type</c>).</summary>
    public static readonly Counter<long> AgentTraceBlobUploadFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_trace_blob_upload_failures_total",
            description: "Total failed agent trace blob uploads after all retries.");

    
    /// <summary>
    ///     Real-mode SQL inline fallback for full prompt/response when blob key is missing (labels: <c>agent_type</c>,
    ///     <c>blob_type</c>=system_prompt|user_prompt|response).
    /// </summary>
    public static readonly Counter<long> AgentTracePromptInlineFallbacksTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_trace_prompt_inline_fallback_total",
            description: "Full-text agent trace fields stored inline after blob miss (Real execution only).");

    
    /// <summary>Evidence-package scalar fields rewritten after deterministic injection-pattern match.</summary>
    public static readonly Counter<long> EvidenceInjectionFieldsRedactedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_evidence_prompt_injection_fields_redacted_total",
            description: "Evidence scalar fields redacted after prompt-injection heuristics matched.");

    
    /// <summary>
    ///     Aggregate explanation replaced LLM text with deterministic manifest narrative due to low explanation faithfulness.
    /// </summary>
    public static readonly Counter<long> ExplanationAggregateFaithfulnessFallbacksTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_aggregate_faithfulness_fallback_total",
            description: "Aggregate run explanation used deterministic narrative after low faithfulness vs findings.");

    
    /// <summary>Citation chips emitted on aggregate explanations (label <c>kind</c>: <c>CitationKind</c> enum name).</summary>
    public static readonly Counter<long> ExplanationCitationsEmitted =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_citations_emitted_total",
            description: "Citation references attached to aggregate run explanations (label kind).");

    
    /// <summary>
    ///     Heuristic overlap between aggregate explanation tokens and flattened finding <c>ExplainabilityTrace</c> text
    ///     (0.0–1.0).
    /// </summary>
    public static readonly Histogram<double> ExplanationFaithfulnessRatio = AppMeter.CreateHistogram<double>(
        "archlucid_explanation_faithfulness_ratio",
        description: "Heuristic faithfulness of run explanation vs finding traces (0.0–1.0).");

    
    /// <summary>
    ///     Successful explanation LLM completions after a schema-validation retry (label: <c>explanation_type</c>).
    /// </summary>
    public static readonly Counter<long> ExplanationRetrySuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_retry_success_total",
            description: "Explanation LLM schema retry succeeded (label: explanation_type).");

    
    /// <summary>
    ///     Schema validation of explanation LLM JSON (labels: <c>explanation_type</c>, <c>outcome</c>
    ///     =valid|invalid|skipped).
    /// </summary>
    public static readonly Counter<long> ExplanationSchemaValidationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_schema_validations_total",
            description: "Schema validation of explanation LLM payloads (labels: explanation_type, outcome).");

    /// <summary>Increments <see cref="AgentHandlerDegradationsTotal" /> for degraded non-Critic handler fallbacks.</summary>
    public static void RecordAgentHandlerDegraded(string agentTypeKey, string degradationReasonCode)
    {
        string agentType = string.IsNullOrWhiteSpace(agentTypeKey) ? "unknown" : agentTypeKey.Trim();
        string reason = string.IsNullOrWhiteSpace(degradationReasonCode) ? "unknown" : degradationReasonCode.Trim();

        TagList tags = new()
        {
            { "agent_type_key", agentType },
            { "degradation_reason", reason },
        };

        AgentHandlerDegradationsTotal.Add(1, tags);
    }

    /// <summary>Increments <c>archlucid_explanation_schema_validations_total</c> (outcome: valid, invalid, or skipped).</summary>
    public static void RecordExplanationSchemaValidation(string explanationType, string outcome)
    {
        TagList tags = new() { { "explanation_type", explanationType }, { "outcome", outcome } };

        ExplanationSchemaValidationsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="ExplanationRetrySuccessTotal" />.</summary>
    public static void RecordExplanationRetrySuccess(string explanationType)
    {
        string type = string.IsNullOrWhiteSpace(explanationType) ? "unknown" : explanationType.Trim();
        TagList tags = new() { { "explanation_type", type } };

        ExplanationRetrySuccessTotal.Add(1, tags);
    }

    /// <summary>Records <see cref="ExplanationFaithfulnessRatio" /> (clamped 0–1).</summary>
    public static void RecordExplanationFaithfulnessRatio(double ratio)
    {
        double clamped = Math.Clamp(ratio, 0.0, 1.0);
        ExplanationFaithfulnessRatio.Record(clamped);
    }
}

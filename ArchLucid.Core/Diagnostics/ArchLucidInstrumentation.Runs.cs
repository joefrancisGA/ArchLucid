using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Authority-run / finding-engine / try-real-mode telemetry recording.
/// </summary>
/// <remarks>
///     Instrument field declarations for this subsystem live in this partial.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    // Instrument catalog

    
    /// <summary>
    ///     Schema validation of raw <c>AgentResult</c> LLM JSON (labels: <c>agent_type</c>, <c>outcome</c>
    ///     =valid|invalid).
    /// </summary>
    public static readonly Counter<long> AgentResultSchemaValidationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_result_schema_validations_total",
            description: "Schema validation of raw AgentResult LLM output (labels: agent_type, outcome).");

    
    /// <summary>
    ///     Successful <c>AgentResult</c> parses after schema remediation (labels: <c>agent_type</c>, <c>schema_retry_count</c>).
    /// </summary>
    public static readonly Counter<long> AgentSchemaRemediationCompletionsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.agent.schema_remediation_completions_total",
            description: "Successful AgentResult parses after schema remediation (labels: agent_type, schema_retry_count).");

    
    /// <summary>Follow-up LLM attempts after an <c>AgentResult</c> schema violation (label: <c>agent_type</c>).</summary>
    public static readonly Counter<long> AgentSchemaRemediationRetriesTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.agent.schema_remediation_retries_total",
            description: "Remediation LLM attempts after AgentResult schema validation failed (label: agent_type).");

    
    /// <summary>Per-stage wall time inside the authority pipeline (labels: <c>stage</c>, <c>outcome</c>=success|error).</summary>
    public static readonly Histogram<double> AuthorityPipelineStageDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_authority_pipeline_stage_duration_ms",
            "ms",
            "Per-stage wall time inside the authority pipeline (labels: stage, outcome).");

    
    /// <summary>
    ///     Authority pipeline stages skipped because run header checkpoint FKs were already set (label <c>stage</c>).
    /// </summary>
    public static readonly Counter<long> AuthorityPipelineStageSkippedCheckpointTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_authority_pipeline_stage_skipped_checkpoint_total",
            description: "Authority pipeline stage skipped on retry due to persisted checkpoint (labels: stage).");

    
    /// <summary>Authority runs that finished the synchronous pipeline successfully (post-commit).</summary>
    public static readonly Counter<long> AuthorityRunsCompletedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_authority_runs_completed_total",
            description: "Authority runs completed through FinalizeCommittedPipelineAsync.");

    
    /// <summary>Finding engines that threw during snapshot generation (labels: <c>engine_type</c>, <c>category</c>).</summary>
    public static readonly Counter<long> FindingEngineFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_finding_engine_failures_total",
            description:
            "Finding engines that failed during findings snapshot generation (labels: engine_type, category).");

    
    /// <summary>Findings snapshots saved with at least one engine failure but some engines succeeded.</summary>
    public static readonly Counter<long> FindingsEnginePartialFailureTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_findings_engine_partial_failure_total",
            description:
            "Findings snapshots built with partial engine failures (at least one engine failed, at least one succeeded).");

    
    /// <summary>Insight-density LLM judge completions issued (label: <c>path</c>=engine|architecture).</summary>
    public static readonly Counter<long> InsightDensityJudgeCompletionsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_insight_density_judge_completions_total",
            description: "Insight-density Premium judge completions (label: path).");

    /// <summary>
    ///     Promoted findings skipped because the per-snapshot judge cap was reached (label: <c>path</c>).
    /// </summary>
    public static readonly Counter<long> InsightDensityJudgeSkippedByCapTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_insight_density_judge_skipped_by_cap_total",
            description: "Insight-density judge candidates skipped by MaxJudgedFindingsPerSnapshot (label: path).");

    
    /// <summary>Findings produced across completed runs (label: <c>severity</c>).</summary>
    public static readonly Counter<long> FindingsProducedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_findings_produced_total",
            description: "Findings produced across all completed runs (label: severity).");

    
    /// <summary>Authority pipeline orchestrator state transitions (labels: <c>from_state</c>, <c>to_state</c>).</summary>
    public static readonly Counter<long> OrchestratorTransitionTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_orchestrator_transition_total",
            description: "Authority pipeline orchestrator state transitions (labels: from_state, to_state).");

    
    /// <summary>Authority pipeline runs that exceeded <c>AuthorityPipeline:PipelineTimeout</c>.</summary>
    public static readonly Counter<long> PipelineTimeoutsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_authority_pipeline_timeouts_total",
            description: "Authority pipeline executions canceled by configured pipeline timeout.");

    
    /// <summary>
    ///     Operator new-run wizard cost-preview fetches when <c>AgentExecution:Mode=Real</c> (no tenant / PII tags).
    /// </summary>
    public static readonly Counter<long> RunsCostPreviewViewedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.runs.cost_preview.viewed_total",
            description: "GET /v1/agent-execution/cost-preview served for Real mode (wizard review step).");

    
    /// <summary>Authority runs created (pre-pipeline, at <c>RunRecord</c> insertion).</summary>
    public static readonly Counter<long> RunsCreatedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_runs_created_total",
            description: "Authority runs created (pre-pipeline, at RunRecord insertion).");

    
    /// <summary><c>archlucid try --real</c> path: execute invoked with pilot try header (API-side proxy for CLI intent).</summary>
    public static readonly Counter<long> TryRealModeAttemptedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.try.real_mode.attempted_total",
            description: "archlucid try --real: pilot-marked execute attempts.");

    
    /// <summary><c>archlucid try --real</c> path: simulator substitution after seed-fake-results fallback.</summary>
    public static readonly Counter<long> TryRealModeFellBackToSimulatorTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.try.real_mode.fellback_to_simulator_total",
            description: "archlucid try --real: fell back to simulator output (development seed path).");

    
    /// <summary><c>archlucid try --real</c> path: pilot-marked execute returned success.</summary>
    public static readonly Counter<long> TryRealModeSucceededTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.try.real_mode.succeeded_total",
            description: "archlucid try --real: pilot-marked execute successes.");

    /// <summary>Increments <c>archlucid.try.real_mode.attempted_total</c>.</summary>
    public static void RecordTryRealModePilotAttempted() => TryRealModeAttemptedTotal.Add(1);

    /// <summary>Increments <c>archlucid.try.real_mode.succeeded_total</c>.</summary>
    public static void RecordTryRealModePilotSucceeded() => TryRealModeSucceededTotal.Add(1);

    /// <summary>Increments <c>archlucid.try.real_mode.fellback_to_simulator_total</c>.</summary>
    public static void RecordTryRealModePilotFellBackToSimulator() => TryRealModeFellBackToSimulatorTotal.Add(1);

    /// <summary>Increments <c>archlucid_finding_engine_failures_total</c>.</summary>
    public static void RecordFindingEngineFailure(string engineType, string category)
    {
        TagList tags = new() { { "engine_type", engineType }, { "category", category } };

        FindingEngineFailuresTotal.Add(1, tags);
    }

    /// <summary>Increments <c>archlucid_findings_engine_partial_failure_total</c>.</summary>
    public static void RecordFindingsEnginePartialFailure()
    {
        FindingsEnginePartialFailureTotal.Add(1);
    }

    /// <summary>Increments <c>archlucid_agent_result_schema_validations_total</c> (outcome: valid or invalid).</summary>
    public static void RecordAgentResultSchemaValidation(string agentType, string outcome)
    {
        TagList tags = new() { { "agent_type", agentType }, { "outcome", outcome } };

        AgentResultSchemaValidationsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="AgentSchemaRemediationRetriesTotal" />.</summary>
    public static void RecordAgentSchemaRemediationRetry(string agentTypeLabel)
    {
        string t = string.IsNullOrWhiteSpace(agentTypeLabel) ? "unknown" : agentTypeLabel.Trim();
        TagList tags = new() { { "agent_type", t } };

        AgentSchemaRemediationRetriesTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="AgentSchemaRemediationCompletionsTotal" /> with the retry count required for success.</summary>
    public static void RecordAgentSchemaRemediationCompletion(string agentTypeLabel, int schemaRetryCount)
    {
        string t = string.IsNullOrWhiteSpace(agentTypeLabel) ? "unknown" : agentTypeLabel.Trim();
        int clamped = schemaRetryCount < 0 ? 0 : schemaRetryCount;
        TagList tags = new() { { "agent_type", t }, { "schema_retry_count", clamped.ToString(System.Globalization.CultureInfo.InvariantCulture) } };

        AgentSchemaRemediationCompletionsTotal.Add(1, tags);
    }

    /// <summary>Records orchestrator state transitions on the active trace and Prometheus counter.</summary>
    public static void RecordOrchestratorStateTransition(Guid runId, string fromState, string toState)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fromState);
        ArgumentException.ThrowIfNullOrWhiteSpace(toState);

        TagList tags = new();
        tags.Add("from_state", fromState);
        tags.Add("to_state", toState);
        OrchestratorTransitionTotal.Add(1, tags);

        Activity? activity = Activity.Current;

        if (activity is null)
            return;

        activity.AddEvent(
            new ActivityEvent(
                "orchestrator.state_transition",
                tags: new ActivityTagsCollection
                {
                    { "archlucid.run_id", runId.ToString("D") },
                    { "from_state", fromState },
                    { "to_state", toState },
                }));
    }
}

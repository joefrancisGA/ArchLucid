using System.Diagnostics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Authority-run / finding-engine / try-real-mode telemetry recording.
/// </summary>
/// <remarks>
///     Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c>.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
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

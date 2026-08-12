using System.Diagnostics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Agent handler degradation and explanation LLM schema/faithfulness telemetry.</summary>
/// <remarks>
///     Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c>.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
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

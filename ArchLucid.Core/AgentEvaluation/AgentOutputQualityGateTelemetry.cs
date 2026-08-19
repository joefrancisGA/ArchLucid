namespace ArchLucid.Core.AgentEvaluation;

/// <summary>
///     Low-cardinality label values for agent-output quality-gate telemetry.
/// </summary>
public static class AgentOutputQualityGateTelemetry
{
    public const string RejectReasonNone = "none";

    public const string RejectReasonStructural = "structural";

    public const string RejectReasonSemantic = "semantic";

    public const string RejectReasonFaithfulness = "faithfulness";

    public const string ExecutionModeSimulator = "simulator";

    public const string ExecutionModeReal = "real";

    public static string ResolveExecutionModeLabel(string? agentExecutionMode)
    {
        if (string.Equals(agentExecutionMode?.Trim(), "Real", StringComparison.OrdinalIgnoreCase))
            return ExecutionModeReal;

        return ExecutionModeSimulator;
    }
}

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Stable, non-sensitive summary of a coordinator agent execution failure for run detail and durable
///     <c>LastFailureReason</c> JSON.
/// </summary>
public sealed class AgentExecutionFailureSummary
{
    /// <summary>Schema version for forward-compatible deserialization from <c>LastFailureReason</c>.</summary>
    public int SchemaVersion { get; set; } = 1;

    /// <summary>Dispatch key (e.g. topology, cost) when known.</summary>
    public string? AgentTypeKey { get; set; }

    /// <summary><see cref="ArchLucid.Contracts.Common.AgentType" /> enum name when known.</summary>
    public string? AgentType { get; set; }

    /// <summary>One of <see cref="AgentExecutionFailureClasses" /> values.</summary>
    public string FailureClass { get; set; } = AgentExecutionFailureClasses.Unknown;

    /// <summary>Optional code aligned with <see cref="AgentExecutionTraceFailureReasonCodes" /> when applicable.</summary>
    public string? ReasonCode { get; set; }
}

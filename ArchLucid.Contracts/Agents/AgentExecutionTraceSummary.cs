using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Cross-context summary of one agent LLM call (list endpoints and cost rollups). Full forensic fields live in
///     <see cref="AgentExecutionTrace" /> JSON persisted by the runtime.
/// </summary>
public sealed class AgentExecutionTraceSummary
{
    public string TraceId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string TaskId
    {
        get;
        set;
    } = string.Empty;

    public AgentType AgentType
    {
        get;
        set;
    }

    public int? InputTokenCount
    {
        get;
        set;
    }

    public int? OutputTokenCount
    {
        get;
        set;
    }

    public decimal? EstimatedCostUsd
    {
        get;
        set;
    }

    public string? ModelDeploymentName
    {
        get;
        set;
    }

    public bool ParseSucceeded
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public bool QualityWarning
    {
        get;
        set;
    }

    public bool QualityRejected
    {
        get;
        set;
    }

    public static AgentExecutionTraceSummary FromTrace(AgentExecutionTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        return new AgentExecutionTraceSummary
        {
            TraceId = trace.TraceId,
            RunId = trace.RunId,
            TaskId = trace.TaskId,
            AgentType = trace.AgentType,
            InputTokenCount = trace.InputTokenCount,
            OutputTokenCount = trace.OutputTokenCount,
            EstimatedCostUsd = trace.EstimatedCostUsd,
            ModelDeploymentName = trace.ModelDeploymentName,
            ParseSucceeded = trace.ParseSucceeded,
            CreatedUtc = trace.CreatedUtc,
            QualityWarning = trace.QualityWarning,
            QualityRejected = trace.QualityRejected,
        };
    }
}

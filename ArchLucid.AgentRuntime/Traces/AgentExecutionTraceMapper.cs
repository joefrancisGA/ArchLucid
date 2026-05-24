using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Traces;

/// <summary>Merges and splits persisted trace JSON between summary and runtime detail shapes.</summary>
public static class AgentExecutionTraceMapper
{
    public static AgentExecutionTrace Merge(AgentExecutionTraceSummary summary, AgentExecutionTraceDetail detail)
    {
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(detail);

        AgentExecutionTrace trace = new()
        {
            TraceId = summary.TraceId,
            RunId = summary.RunId,
            TaskId = summary.TaskId,
            AgentType = summary.AgentType,
            InputTokenCount = summary.InputTokenCount,
            OutputTokenCount = summary.OutputTokenCount,
            EstimatedCostUsd = summary.EstimatedCostUsd,
            ModelDeploymentName = summary.ModelDeploymentName,
            ParseSucceeded = summary.ParseSucceeded,
            CreatedUtc = summary.CreatedUtc,
            QualityWarning = summary.QualityWarning,
            QualityRejected = summary.QualityRejected,
        };

        detail.ApplyTo(trace);
        return trace;
    }

    public static (AgentExecutionTraceSummary Summary, AgentExecutionTraceDetail Detail) Split(AgentExecutionTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        return (AgentExecutionTraceSummary.FromTrace(trace), AgentExecutionTraceDetail.FromTrace(trace));
    }
}

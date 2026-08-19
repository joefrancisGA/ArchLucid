using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper parameter objects for the <c>dbo.AgentExecutionTraces</c> delete-then-insert upsert (TB-044).
/// </summary>
internal static class AgentExecutionTraceInsertParameters
{
    /// <summary>Matches <c>dbo.AgentExecutionTraces.ModelAlias</c> NVARCHAR(260).</summary>
    private const int ModelAliasMaxLength = 260;

    /// <summary>Attempt key used by both delete statements before the insert.</summary>
    public static object AttemptKey(AgentExecutionTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        return new
        {
            RunId = SqlRunIdMapping.ToSqlRunId(trace.RunId),
            trace.TaskId,
            AgentType = trace.AgentType.ToString(),
            trace.AttemptIndex
        };
    }

    public static object Create(AgentExecutionTrace trace, string traceJson)
    {
        ArgumentNullException.ThrowIfNull(trace);

        return new
        {
            trace.TraceId,
            RunId = SqlRunIdMapping.ToSqlRunId(trace.RunId),
            trace.TaskId,
            AgentType = trace.AgentType.ToString(),
            trace.AttemptIndex,
            trace.ParseSucceeded,
            trace.ErrorMessage,
            TraceJson = traceJson,
            trace.CreatedUtc,
            trace.FullSystemPromptBlobKey,
            trace.FullUserPromptBlobKey,
            trace.FullResponseBlobKey,
            trace.ModelDeploymentName,
            trace.ModelVersion,
            trace.SystemPromptContentHash,
            trace.InputTokenCount,
            trace.OutputTokenCount,
            trace.ReasoningTokenCount,
            trace.EstimatedCostUsd,
            ModelAlias = TruncateModelAlias(trace.ModelAlias),
            trace.QualityWarning,
            trace.QualityRejected,
            trace.ProviderConnectionId
        };
    }

    private static string? TruncateModelAlias(string? modelAlias) =>
        string.IsNullOrEmpty(modelAlias) || modelAlias.Length <= ModelAliasMaxLength
            ? modelAlias
            : modelAlias[..ModelAliasMaxLength];
}

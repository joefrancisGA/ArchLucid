using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Builds the Dapper parameter object for a single <c>dbo.AgentResults</c> insert, shared by create and replace so the
///     two paths cannot drift apart on serialization or run-id mapping.
/// </summary>
internal static class AgentResultInsertParameters
{
    public static object Create(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new
        {
            result.ResultId,
            result.TaskId,
            RunId = SqlRunIdMapping.ToSqlRunId(result.RunId),
            AgentType = result.AgentType.ToString(),
            result.Confidence,
            result.CalibratedConfidence,
            result.ProposedEvidenceJson,
            result.PromptVariantKey,
            TaskStructuralExecutionMode = (byte?)result.TaskStructuralExecutionMode,
            result.CacheServed,
            ResultJson = Serialize(result),
            result.CreatedUtc
        };
    }

    public static object RunTaskKey(string runId, string taskId) =>
        new { RunId = SqlRunIdMapping.ToSqlRunId(runId), TaskId = taskId };

    public static string Serialize(AgentResult result) => JsonSerializer.Serialize(result, ContractJson.Default);
}

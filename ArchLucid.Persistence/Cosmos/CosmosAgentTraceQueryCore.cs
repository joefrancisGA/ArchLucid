using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Azure.Cosmos;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>
///     Shared Cosmos query definitions and paging helpers for agent execution traces.
/// </summary>
internal static class CosmosAgentTraceQueryCore
{
    public static int ClampPageOffset(int offset) => AgentExecutionTraceQueryPatchCore.ClampPageOffset(offset);

    public static int ClampPageLimit(int limit) => AgentExecutionTraceQueryPatchCore.ClampPageLimit(limit);

    public static QueryDefinition RunIdCountQuery(string runId) =>
        new QueryDefinition("SELECT VALUE COUNT(1) FROM c WHERE c.runId = @runId")
            .WithParameter("@runId", runId);

    public static QueryDefinition RunIdFullDocumentPageQuery(string runId, int offset, int limit) =>
        new QueryDefinition(
                """
                SELECT * FROM c
                WHERE c.runId = @runId
                ORDER BY c.createdUtc
                OFFSET @off LIMIT @lim
                """)
            .WithParameter("@runId", runId)
            .WithParameter("@off", ClampPageOffset(offset))
            .WithParameter("@lim", ClampPageLimit(limit));

    public static QueryDefinition RunIdSummaryPageQuery(string runId, int offset, int limit) =>
        new QueryDefinition(
                """
                SELECT c.id, c.runId, c.taskId, c.createdUtc, c.agentType, c.parseSucceeded,
                       c.inputTokenCount, c.outputTokenCount, c.estimatedCostUsd,
                       c.modelDeploymentName, c.modelAlias, c.qualityWarning, c.qualityRejected,
                       c.blobUploadFailed
                FROM c
                WHERE c.runId = @runId
                ORDER BY c.createdUtc
                OFFSET @off LIMIT @lim
                """)
            .WithParameter("@runId", runId)
            .WithParameter("@off", ClampPageOffset(offset))
            .WithParameter("@lim", ClampPageLimit(limit));

    public static QueryDefinition RunIdLlmCostSliceQuery(string runId) =>
        new QueryDefinition(
                """
                SELECT c.inputTokenCount, c.outputTokenCount, c.modelDeploymentName
                FROM c
                WHERE c.runId = @runId
                """)
            .WithParameter("@runId", runId);

    public static QueryDefinition RunIdAgentTypeDeploymentQuery(string runId) =>
        new QueryDefinition(
                """
                SELECT c.agentType, c.modelDeploymentName
                FROM c
                WHERE c.runId = @runId
                """)
            .WithParameter("@runId", runId);

    public static QueryDefinition TaskIdQuery(string taskId) =>
        new QueryDefinition("SELECT * FROM c WHERE c.taskId = @taskId ORDER BY c.createdUtc")
            .WithParameter("@taskId", taskId);

    public static QueryDefinition TraceIdQuery(string traceId) =>
        new QueryDefinition("SELECT * FROM c WHERE c.id = @id").WithParameter("@id", traceId);

    public static QueryRequestOptions PartitionedByRunId(string runId) =>
        new() { PartitionKey = new PartitionKey(runId) };

    public static AgentExecutionTraceLlmCostSlice MapLlmCostProjection(AgentTraceLlmCostProjection row) =>
        new()
        {
            ModelDeploymentName = row.ModelDeploymentName,
            InputTokenCount = row.InputTokenCount,
            OutputTokenCount = row.OutputTokenCount,
            ReasoningTokenCount = null,
        };
}

using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>Maps between <see cref="AgentExecutionTrace" /> and Cosmos <see cref="AgentTraceDocument" /> shapes.</summary>
internal static class CosmosAgentTraceDocumentMapper
{
    internal static AgentTraceDocument BuildDocument(AgentExecutionTrace trace, string json, int? ttl)
    {
        ArgumentNullException.ThrowIfNull(trace);
        ArgumentException.ThrowIfNullOrWhiteSpace(json);

        return new AgentTraceDocument
        {
            Id = trace.TraceId,
            RunId = trace.RunId,
            TraceJson = json,
            CreatedUtc = trace.CreatedUtc.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture),
            TaskId = trace.TaskId,
            Ttl = ttl,
            AgentType = trace.AgentType.ToString(),
            ParseSucceeded = trace.ParseSucceeded,
            InputTokenCount = trace.InputTokenCount,
            OutputTokenCount = trace.OutputTokenCount,
            EstimatedCostUsd = trace.EstimatedCostUsd,
            ModelDeploymentName = trace.ModelDeploymentName,
            ModelAlias = trace.ModelAlias,
            QualityWarning = trace.QualityWarning,
            QualityRejected = trace.QualityRejected,
            BlobUploadFailed = trace.BlobUploadFailed,
        };
    }

    internal static AgentExecutionTrace Deserialize(AgentTraceDocument doc)
    {
        return JsonSerializer.Deserialize<AgentExecutionTrace>(doc.TraceJson, ContractJson.Default)
               ?? throw new InvalidOperationException("Trace document deserialized to null.");
    }

    internal static AgentExecutionTraceSummary MapSummaryProjection(AgentTraceSummaryProjection row)
    {
        ArgumentNullException.ThrowIfNull(row);

        AgentType agentType = default;

        if (!string.IsNullOrWhiteSpace(row.AgentType)
            && Enum.TryParse(row.AgentType, ignoreCase: true, out AgentType parsed))
        {
            agentType = parsed;
        }

        DateTime createdUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        if (!string.IsNullOrWhiteSpace(row.CreatedUtc)
            && DateTime.TryParse(
                row.CreatedUtc,
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out DateTime parsedCreated))
        {
            createdUtc = parsedCreated.ToUniversalTime();
        }

        return new AgentExecutionTraceSummary
        {
            TraceId = row.Id,
            RunId = row.RunId,
            TaskId = row.TaskId,
            AgentType = agentType,
            InputTokenCount = row.InputTokenCount,
            OutputTokenCount = row.OutputTokenCount,
            EstimatedCostUsd = row.EstimatedCostUsd,
            ModelDeploymentName = row.ModelDeploymentName,
            ModelAlias = row.ModelAlias,
            ParseSucceeded = row.ParseSucceeded,
            CreatedUtc = createdUtc,
            QualityWarning = row.QualityWarning,
            QualityRejected = row.QualityRejected,
            BlobUploadFailed = row.BlobUploadFailed,
        };
    }
}

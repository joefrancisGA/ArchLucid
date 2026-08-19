using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Maps <c>dbo.AgentExecutionTraces</c> rows onto contract shapes: blob deserialization, summary projection, and
///     per-run grouping of the multi-run reads.
/// </summary>
/// <remarks>
///     Trace blobs are treated as required data — an unreadable blob throws rather than being skipped, because traces
///     are the evidence trail for a review and a silently short read would look like the agent never ran.
/// </remarks>
internal static class AgentExecutionTraceProjectionMapper
{
    /// <param name="context">Human-readable read description used in the failure message (for example <c>run 'r-1'</c>).</param>
    public static IReadOnlyList<AgentExecutionTrace> DeserializeTraces(
        IEnumerable<string> jsonRows,
        string context)
    {
        ArgumentNullException.ThrowIfNull(jsonRows);

        List<AgentExecutionTrace> traces = [];

        foreach (string json in jsonRows)
        {
            traces.Add(DeserializeTrace(json, context));
        }

        return traces;
    }

    /// <summary>Deserializes a single stored blob, or <see langword="null" /> when the row was absent.</summary>
    public static AgentExecutionTrace? DeserializeOptionalTrace(string? json) =>
        string.IsNullOrEmpty(json)
            ? null
            : JsonSerializer.Deserialize<AgentExecutionTrace>(json, ContractJson.Default);

    public static List<AgentExecutionTraceSummary> MapSummaries(IEnumerable<AgentExecutionTraceSummaryPageRow> rows)
    {
        ArgumentNullException.ThrowIfNull(rows);

        return rows.Select(MapSummary).ToList();
    }

    /// <summary>
    ///     Groups cost slices by contract run id, guaranteeing an entry for every requested run so callers can index the
    ///     result without a fallback branch.
    /// </summary>
    public static IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> GroupCostSlices(
        IEnumerable<AgentExecutionTraceLlmCostSliceRow> rows,
        IReadOnlyList<string> requestedRunIds)
    {
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(requestedRunIds);

        Dictionary<string, List<AgentExecutionTraceLlmCostSlice>> grouped = new(StringComparer.OrdinalIgnoreCase);

        foreach (AgentExecutionTraceLlmCostSliceRow row in rows)
        {
            string contractRunId = SqlRunIdMapping.ToContractRunId(row.RunId);

            AddTo(grouped, contractRunId).Add(new AgentExecutionTraceLlmCostSlice
            {
                ModelDeploymentName = row.ModelDeploymentName,
                InputTokenCount = row.InputTokenCount,
                OutputTokenCount = row.OutputTokenCount,
                ReasoningTokenCount = row.ReasoningTokenCount,
            });
        }

        Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> result = new(StringComparer.OrdinalIgnoreCase);

        foreach (string runId in requestedRunIds)
        {
            result[runId] = grouped.TryGetValue(runId, out List<AgentExecutionTraceLlmCostSlice>? slices) ? slices : [];
        }

        return result;
    }

    /// <summary>
    ///     Groups LLM-fallback agent types per requested run id, de-duplicated and ordered so callers get a stable list.
    /// </summary>
    /// <remarks>
    ///     Rows are keyed by the SQL run id, so lookup converts each requested contract id rather than converting every
    ///     row back.
    /// </remarks>
    public static IReadOnlyDictionary<string, IReadOnlyList<string>> GroupFallbackAgentTypes(
        IEnumerable<AgentExecutionTraceLlmFallbackRow> rows,
        IReadOnlyList<string> requestedRunIds)
    {
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(requestedRunIds);

        Dictionary<Guid, List<string>> grouped = [];

        foreach (AgentExecutionTraceLlmFallbackRow row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.AgentType))
                continue;

            AddTo(grouped, row.RunId).Add(row.AgentType.Trim());
        }

        Dictionary<string, IReadOnlyList<string>> result = new(StringComparer.OrdinalIgnoreCase);

        foreach (string runId in requestedRunIds)
        {
            result[runId] = grouped.TryGetValue(SqlRunIdMapping.ToSqlRunId(runId), out List<string>? agentTypes)
                ? SortDistinct(agentTypes)
                : [];
        }

        return result;
    }

    private static AgentExecutionTrace DeserializeTrace(string json, string context)
    {
        AgentExecutionTrace? trace;

        try
        {
            trace = JsonSerializer.Deserialize<AgentExecutionTrace>(json, ContractJson.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize an AgentExecutionTrace for {context}. " +
                "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
        }

        if (trace is null)

            throw new InvalidOperationException(
                $"An AgentExecutionTrace row for {context} deserialized to null. " +
                "The stored JSON may be empty or corrupt.");

        return trace;
    }

    private static AgentExecutionTraceSummary MapSummary(AgentExecutionTraceSummaryPageRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (!Enum.TryParse(row.AgentType, ignoreCase: true, out AgentType agentType))

            throw new InvalidOperationException(
                $"AgentExecutionTraces.AgentType value '{row.AgentType}' is not a known AgentType.");

        return new AgentExecutionTraceSummary
        {
            TraceId = row.TraceId,
            RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
            TaskId = row.TaskId,
            AgentType = agentType,
            ParseSucceeded = row.ParseSucceeded,
            CreatedUtc = row.CreatedUtc,
            ModelDeploymentName = row.ModelDeploymentName,
            BlobUploadFailed = row.BlobUploadFailed,
            InputTokenCount = row.InputTokenCount,
            OutputTokenCount = row.OutputTokenCount,
            EstimatedCostUsd = row.EstimatedCostUsd,
            ModelAlias = row.ModelAlias,
            QualityWarning = row.QualityWarning,
            QualityRejected = row.QualityRejected,
        };
    }

    private static List<string> SortDistinct(IEnumerable<string> values) =>
        values
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static s => s, StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static List<TValue> AddTo<TKey, TValue>(Dictionary<TKey, List<TValue>> grouped, TKey key)
        where TKey : notnull
    {
        if (!grouped.TryGetValue(key, out List<TValue>? list))
        {
            list = [];
            grouped[key] = list;
        }

        return list;
    }
}

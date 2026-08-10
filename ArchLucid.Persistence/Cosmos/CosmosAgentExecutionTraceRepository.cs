using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>Cosmos-backed <see cref="IAgentExecutionTraceRepository" />.</summary>
[ExcludeFromCodeCoverage(Justification = "Requires Cosmos account or emulator.")]
public sealed class CosmosAgentExecutionTraceRepository(
    CosmosClientFactory clientFactory,
    IOptionsMonitor<CosmosDbOptions> optionsMonitor) : IAgentExecutionTraceRepository
{
    private const string ContainerId = "agent-traces";

    private readonly CosmosClientFactory _clientFactory =
        clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));

    private readonly IOptionsMonitor<CosmosDbOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <inheritdoc />
    public async Task CreateAsync(AgentExecutionTrace trace, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(trace);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);
        CosmosDbOptions opts = _optionsMonitor.CurrentValue;
        string json = JsonSerializer.Serialize(trace, ContractJson.Default);
        int? ttl = opts.AgentTraceTtlSeconds > 0 ? opts.AgentTraceTtlSeconds : null;

        AgentTraceDocument doc = BuildDocument(trace, json, ttl);

        await container.CreateItemAsync(doc, new PartitionKey(trace.RunId), cancellationToken: cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchBlobStorageFieldsAsync(
        string traceId,
        string? fullSystemPromptBlobKey,
        string? fullUserPromptBlobKey,
        string? fullResponseBlobKey,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.FullSystemPromptBlobKey = fullSystemPromptBlobKey ?? trace.FullSystemPromptBlobKey;
        trace.FullUserPromptBlobKey = fullUserPromptBlobKey ?? trace.FullUserPromptBlobKey;
        trace.FullResponseBlobKey = fullResponseBlobKey ?? trace.FullResponseBlobKey;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchBlobUploadFailedAsync(string traceId, bool failed,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.BlobUploadFailed = failed ? true : null;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchInlinePromptFallbackAsync(
        string traceId,
        string? fullSystemPromptInline,
        string? fullUserPromptInline,
        string? fullResponseInline,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        if (fullSystemPromptInline is not null)
            trace.FullSystemPromptInline = fullSystemPromptInline;

        if (fullUserPromptInline is not null)
            trace.FullUserPromptInline = fullUserPromptInline;

        if (fullResponseInline is not null)
            trace.FullResponseInline = fullResponseInline;

        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchInlineFallbackFailedAsync(string traceId, bool failed,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.InlineFallbackFailed = failed ? true : null;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchQualityWarningAsync(string traceId, bool qualityWarning,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.QualityWarning = qualityWarning;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchQualityRejectedAsync(string traceId, bool qualityRejected,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.QualityRejected = qualityRejected;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchQualityGateRecordedSnapshotAsync(
        string traceId,
        AgentOutputQualityGateOutcome recordedOutcome,
        string definitionVersion,
        string definitionContentHashSha256,
        string gateMode,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null || trace.RecordedQualityGateOutcome is not null)
            return;

        trace.QualityWarning = recordedOutcome == AgentOutputQualityGateOutcome.Warned;
        trace.QualityRejected = recordedOutcome == AgentOutputQualityGateOutcome.Rejected;
        trace.QualityGateDefinitionVersion = definitionVersion;
        trace.QualityGateDefinitionContentHashSha256 = definitionContentHashSha256;
        trace.QualityGateDefinitionMode = gateMode;
        trace.RecordedQualityGateOutcome = recordedOutcome;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<AgentExecutionTrace?> GetByTraceIdAsync(string traceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        AgentTraceDocument? doc = await FindDocumentByTraceIdAsync(traceId, cancellationToken);

        return doc is null ? null : Deserialize(doc);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        (IReadOnlyList<AgentExecutionTrace> traces, _) = await QueryRunPageAsync(runId, 0, 500, cancellationToken);

        return traces;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> GetLlmCostSlicesByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        return await QueryLlmCostSlicesByRunIdAsync(runId, cancellationToken);
    }

    public async Task<IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>> GetLlmCostSlicesByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyCollection<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> map =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (string runId in normalized)
        {
            map[runId] = await GetLlmCostSlicesByRunIdAsync(scope, runId, cancellationToken);
        }

        return map;
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> GetPagedByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        return await QueryRunPageAsync(runId, offset, limit, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<AgentExecutionTraceSummary> Summaries, int TotalCount)> GetPagedSummariesByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);
        int clampedOffset = Math.Max(0, offset);
        int clampedLimit = Math.Clamp(limit, 1, 500);

        QueryDefinition countQuery = new QueryDefinition("SELECT VALUE COUNT(1) FROM c WHERE c.runId = @runId")
            .WithParameter("@runId", runId);

        int total = 0;
        using FeedIterator<int> countIt = container.GetItemQueryIterator<int>(
            countQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        if (countIt.HasMoreResults)
        {
            FeedResponse<int> countPage = await countIt.ReadNextAsync(cancellationToken);
            total = countPage.Resource.FirstOrDefault();
        }

        // Project denormalized summary scalars only — do not SELECT TraceJson on the list path.
        QueryDefinition pageQuery = new QueryDefinition(
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
            .WithParameter("@off", clampedOffset)
            .WithParameter("@lim", clampedLimit);

        using FeedIterator<AgentTraceSummaryProjection> iterator =
            container.GetItemQueryIterator<AgentTraceSummaryProjection>(
                pageQuery,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        List<AgentExecutionTraceSummary> summaries = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceSummaryProjection> page = await iterator.ReadNextAsync(cancellationToken);

            summaries.AddRange(page.Select(MapSummaryProjection));
        }

        return (summaries, total);
    }

    /// <inheritdoc />
    public async Task<int> CountByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition countQuery = new QueryDefinition("SELECT VALUE COUNT(1) FROM c WHERE c.runId = @runId")
            .WithParameter("@runId", runId);

        using FeedIterator<int> countIt = container.GetItemQueryIterator<int>(
            countQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        if (!countIt.HasMoreResults)
            return 0;

        FeedResponse<int> countPage = await countIt.ReadNextAsync(cancellationToken);

        return countPage.Resource.FirstOrDefault();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByTaskIdAsync(
        string taskId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.taskId = @taskId ORDER BY c.createdUtc")
            .WithParameter("@taskId", taskId);

        using FeedIterator<AgentTraceDocument> iterator = container.GetItemQueryIterator<AgentTraceDocument>(query);
        List<AgentExecutionTrace> list = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceDocument> page = await iterator.ReadNextAsync(cancellationToken);

            list.AddRange(page.Select(Deserialize));
        }

        return list;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetDistinctAgentTypesWithLlmResourceFallbackAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        IReadOnlyList<AgentTypeDeploymentProjection> rows =
            await QueryAgentTypeDeploymentProjectionsByRunIdAsync(runId, cancellationToken);

        return DistinctFallbackAgentTypes(rows);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, IReadOnlyList<string>>> GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyList<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        Dictionary<string, IReadOnlyList<string>> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (string rid in normalized)
        {
            IReadOnlyList<AgentTypeDeploymentProjection> rows =
                await QueryAgentTypeDeploymentProjectionsByRunIdAsync(rid, cancellationToken);
            map[rid] = DistinctFallbackAgentTypes(rows);
        }

        return map;
    }

    private static IReadOnlyList<string> DistinctFallbackAgentTypes(IReadOnlyList<AgentTypeDeploymentProjection> rows)
    {
        return rows
            .Where(static row => AgentExecutionTraceDegradationProbe.LlmResourceFallbackModelDeployment(row.ModelDeploymentName))
            .Select(static row => row.AgentType)
            .Where(static agentType => !string.IsNullOrWhiteSpace(agentType))
            .Select(static agentType => agentType!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static agentType => agentType, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private async Task<IReadOnlyList<AgentTypeDeploymentProjection>> QueryAgentTypeDeploymentProjectionsByRunIdAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition query = new QueryDefinition(
                """
                SELECT c.agentType, c.modelDeploymentName
                FROM c
                WHERE c.runId = @runId
                """)
            .WithParameter("@runId", runId);

        using FeedIterator<AgentTypeDeploymentProjection> iterator =
            container.GetItemQueryIterator<AgentTypeDeploymentProjection>(
                query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        List<AgentTypeDeploymentProjection> rows = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTypeDeploymentProjection> page = await iterator.ReadNextAsync(cancellationToken);

            rows.AddRange(page);
        }

        return rows;
    }

    private sealed class AgentTypeDeploymentProjection
    {
        public string? AgentType
        {
            get;
            init;
        }

        public string? ModelDeploymentName
        {
            get;
            init;
        }
    }

    private async Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> QueryRunPageAsync(
        string runId,
        int offset,
        int limit,
        CancellationToken ct)
    {
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        int clampedOffset = Math.Max(0, offset);
        int clampedLimit = Math.Clamp(limit, 1, 500);

        QueryDefinition countQuery = new QueryDefinition("SELECT VALUE COUNT(1) FROM c WHERE c.runId = @runId")
            .WithParameter("@runId", runId);

        int total = 0;
        using FeedIterator<int> countIt = container.GetItemQueryIterator<int>(
            countQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        if (countIt.HasMoreResults)
        {
            FeedResponse<int> countPage = await countIt.ReadNextAsync(ct);
            total = countPage.Resource.FirstOrDefault();
        }

        QueryDefinition pageQuery = new QueryDefinition(
                """
                SELECT * FROM c
                WHERE c.runId = @runId
                ORDER BY c.createdUtc
                OFFSET @off LIMIT @lim
                """)
            .WithParameter("@runId", runId)
            .WithParameter("@off", clampedOffset)
            .WithParameter("@lim", clampedLimit);

        using FeedIterator<AgentTraceDocument> iterator = container.GetItemQueryIterator<AgentTraceDocument>(
            pageQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        List<AgentExecutionTrace> traces = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceDocument> page = await iterator.ReadNextAsync(ct);

            traces.AddRange(page.Select(Deserialize));
        }

        return (traces, total);
    }

    private async Task ReplaceTraceAsync(AgentExecutionTrace trace, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(trace);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        CosmosDbOptions opts = _optionsMonitor.CurrentValue;
        int? ttl = opts.AgentTraceTtlSeconds > 0 ? opts.AgentTraceTtlSeconds : null;
        string json = JsonSerializer.Serialize(trace, ContractJson.Default);
        AgentTraceDocument doc = BuildDocument(trace, json, ttl);

        await container.ReplaceItemAsync(doc, trace.TraceId, new PartitionKey(trace.RunId), cancellationToken: ct);
    }

    private static AgentTraceDocument BuildDocument(AgentExecutionTrace trace, string json, int? ttl)
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

    private async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> QueryLlmCostSlicesByRunIdAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition query = new QueryDefinition(
                """
                SELECT c.inputTokenCount, c.outputTokenCount, c.modelDeploymentName
                FROM c
                WHERE c.runId = @runId
                """)
            .WithParameter("@runId", runId);

        using FeedIterator<AgentTraceLlmCostProjection> iterator =
            container.GetItemQueryIterator<AgentTraceLlmCostProjection>(
                query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        List<AgentExecutionTraceLlmCostSlice> slices = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceLlmCostProjection> page = await iterator.ReadNextAsync(cancellationToken);

            foreach (AgentTraceLlmCostProjection row in page.Resource)
            {
                slices.Add(
                    new AgentExecutionTraceLlmCostSlice
                    {
                        ModelDeploymentName = row.ModelDeploymentName,
                        InputTokenCount = row.InputTokenCount,
                        OutputTokenCount = row.OutputTokenCount,
                        ReasoningTokenCount = null,
                    });
            }
        }

        return slices;
    }

    private static AgentExecutionTraceSummary MapSummaryProjection(AgentTraceSummaryProjection row)
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

    private async Task<AgentExecutionTrace?> LoadTraceAsync(string traceId, CancellationToken ct)
    {
        AgentTraceDocument? doc = await FindDocumentByTraceIdAsync(traceId, ct);

        return doc is null ? null : Deserialize(doc);
    }

    private async Task<AgentTraceDocument?> FindDocumentByTraceIdAsync(string traceId, CancellationToken ct)
    {
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.id = @id").WithParameter("@id", traceId);

        using FeedIterator<AgentTraceDocument> iterator = container.GetItemQueryIterator<AgentTraceDocument>(query);

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceDocument> page = await iterator.ReadNextAsync(ct);
            AgentTraceDocument? doc = page.Resource.FirstOrDefault();

            if (doc is not null)
                return doc;
        }

        return null;
    }

    private static AgentExecutionTrace Deserialize(AgentTraceDocument doc)
    {
        return JsonSerializer.Deserialize<AgentExecutionTrace>(doc.TraceJson, ContractJson.Default)
               ?? throw new InvalidOperationException("Trace document deserialized to null.");
    }

    /// <inheritdoc />
    public Task<int> HardDeleteTracesArchivedBeforeAsync(
        DateTimeOffset archivedBeforeUtc,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        _ = archivedBeforeUtc;
        _ = maxRows;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(0);
    }
}

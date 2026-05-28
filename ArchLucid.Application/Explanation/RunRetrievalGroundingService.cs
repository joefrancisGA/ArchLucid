using System.Text.Json;

using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Explanation;

/// <inheritdoc cref="IRunRetrievalGroundingService" />
public sealed class RunRetrievalGroundingService(
    IAuthorityQueryService authorityQuery,
    IScopeContextProvider scopeContextProvider,
    IRetrievalGroundingTraceReader retrievalGroundingTraceReader) : IRunRetrievalGroundingService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAuthorityQueryService _authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IRetrievalGroundingTraceReader _retrievalGroundingTraceReader =
        retrievalGroundingTraceReader ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceReader));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc />
    public async Task<RunRetrievalGroundingResponse?> BuildAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);

        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail = await _authorityQuery.GetRunDetailAsync(scope, runGuid, cancellationToken);

        if (detail?.Run is null)
            return null;

        IReadOnlyList<RetrievalGroundingTraceRecord> groundingRows =
            await _retrievalGroundingTraceReader.GetByRunIdAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                runGuid,
                cancellationToken);

        List<RunRetrievalGroundingRow> mappedRows = groundingRows
            .Select(MapRow)
            .ToList();

        return new RunRetrievalGroundingResponse
        {
            RunId = detail.Run.RunId.ToString("D"),
            Rows = mappedRows,
            TraceCount = mappedRows.Count,
            HasDegradedMetadata = mappedRows.Any(static r => r.ScoreMetadataMalformed || r.DocumentMetadataMalformed),
        };
    }

    private static RunRetrievalGroundingRow MapRow(RetrievalGroundingTraceRecord row)
    {
        (IReadOnlyList<string> documentIds, bool documentMalformed) = ParseDocumentIds(row.DocumentIdsJson);
        (IReadOnlyList<RunRetrievalGroundingScoreSummary> scores, bool scoreMalformed) =
            ParseScoreSummaries(row.ScoresJson);

        return new RunRetrievalGroundingRow
        {
            TraceId = row.TraceId.ToString("D"),
            AgentName = row.AgentName,
            CorpusKind = row.CorpusKind,
            RetrievedChunkIds = row.RetrievedChunkIds.ToList(),
            DocumentIds = documentIds,
            ScoreSummaries = scores,
            RetrievedChunkCount = row.RetrievedChunkIds.Count,
            TokensIn = row.TokensIn,
            TokensOut = row.TokensOut,
            CitationCoverage = row.CitationCoverage,
            TopK = row.TopK,
            AgentExecutionTraceId = row.AgentExecutionTraceId,
            ScoreMetadataMalformed = scoreMalformed,
            DocumentMetadataMalformed = documentMalformed,
            CreatedUtc = row.CreatedUtc,
        };
    }

    private static (IReadOnlyList<string> DocumentIds, bool Malformed) ParseDocumentIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return ([], false);

        try
        {
            List<string> documentIds = JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];

            return (documentIds.Where(static id => !string.IsNullOrWhiteSpace(id)).ToList(), false);
        }
        catch (JsonException)
        {
            return ([], true);
        }
    }

    private static (IReadOnlyList<RunRetrievalGroundingScoreSummary> Scores, bool Malformed) ParseScoreSummaries(
        string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return ([], false);

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (document.RootElement.ValueKind != JsonValueKind.Array)
                return ([], true);

            List<RunRetrievalGroundingScoreSummary> scores = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                RunRetrievalGroundingScoreSummary? score = TryReadScoreSummary(element);

                if (score is not null)
                    scores.Add(score);
            }

            return (scores, false);
        }
        catch (JsonException)
        {
            return ([], true);
        }
    }

    private static RunRetrievalGroundingScoreSummary? TryReadScoreSummary(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
            return null;

        if (!element.TryGetProperty("chunkId", out JsonElement chunkIdElement))
            return null;

        string? chunkId = chunkIdElement.GetString();

        if (string.IsNullOrWhiteSpace(chunkId))
            return null;

        double? score = null;

        if (element.TryGetProperty("score", out JsonElement scoreElement)
            && scoreElement.ValueKind == JsonValueKind.Number
            && scoreElement.TryGetDouble(out double parsedScore))
        {
            score = parsedScore;
        }

        return new RunRetrievalGroundingScoreSummary
        {
            ChunkId = chunkId.Trim(),
            Score = score,
        };
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}

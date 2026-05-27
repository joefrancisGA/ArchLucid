using System.Text.Json;

using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Evaluation;

namespace ArchLucid.AgentRuntime;

/// <summary>Builds bounded <see cref="RetrievalGroundingTraceInsert" /> rows from retrieval queries and hits.</summary>
public static class RetrievalGroundingTraceBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static RetrievalGroundingTraceInsert Build(
        ScopeContext scope,
        Guid runId,
        string agentName,
        RetrievalQuery query,
        IReadOnlyList<RetrievalHit> hits,
        string? agentExecutionTraceId = null)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(agentName);
        ArgumentNullException.ThrowIfNull(query);

        IReadOnlyList<RetrievalHit> safeHits = hits ?? [];

        double citationCoverage = safeHits.Count == 0
            ? 0d
            : RetrievalFaithfulnessEvaluator.Evaluate(safeHits, string.Empty).SupportRatio;

        AgentCompletionTokenUsage.TryConsume(out int? tokensIn, out int? tokensOut, out _);

        return new RetrievalGroundingTraceInsert
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            AgentName = agentName.Trim(),
            RetrievedChunkIds = safeHits.Select(static h => h.ChunkId).ToList(),
            TokensIn = tokensIn,
            TokensOut = tokensOut,
            CitationCoverage = citationCoverage,
            QueryText = Truncate(query.QueryText, RetrievalGroundingTraceBounds.MaxQueryTextLength),
            TopK = query.TopK,
            CorpusKind = ResolveCorpusKind(safeHits),
            ScoresJson = BuildBoundedScoresJson(safeHits),
            DocumentIdsJson = BuildBoundedDocumentIdsJson(safeHits),
            AgentExecutionTraceId = string.IsNullOrWhiteSpace(agentExecutionTraceId)
                ? null
                : agentExecutionTraceId.Trim(),
        };
    }

    private static string? ResolveCorpusKind(IReadOnlyList<RetrievalHit> hits)
    {
        if (hits.Count == 0)
            return null;

        string? first = hits[0].CorpusKind;

        if (string.IsNullOrWhiteSpace(first))
            return null;

        return hits.All(h => string.Equals(h.CorpusKind, first, StringComparison.OrdinalIgnoreCase))
            ? first
            : "Mixed";
    }

    private static string? BuildBoundedScoresJson(IReadOnlyList<RetrievalHit> hits)
    {
        if (hits.Count == 0)
            return null;

        List<object> scores = hits
            .Select(static h => new { chunkId = h.ChunkId, score = Math.Round(h.Score, 4) })
            .ToList<object>();

        return SerializeBounded(scores, RetrievalGroundingTraceBounds.MaxScoresJsonLength);
    }

    private static string? BuildBoundedDocumentIdsJson(IReadOnlyList<RetrievalHit> hits)
    {
        if (hits.Count == 0)
            return null;

        List<string> documentIds = hits
            .Select(static h => h.DocumentId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (documentIds.Count == 0)
            return null;

        return SerializeBounded(documentIds, RetrievalGroundingTraceBounds.MaxDocumentIdsJsonLength);
    }

    private static string? SerializeBounded<T>(T value, int maxLength)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);

        if (json.Length <= maxLength)
            return json;

        return json[..maxLength];
    }

    private static string? Truncate(string? text, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        string trimmed = text.Trim();

        if (trimmed.Length <= maxLength)
            return trimmed;

        return trimmed[..maxLength];
    }
}

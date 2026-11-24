using ArchLucid.Core.Retrieval;

namespace ArchLucid.Mcp.Tools;

/// <summary>Read-only MCP retrieval tools (RAG-V1.1-002) — delegates to <see cref="IRetrievalQueryService" />.</summary>
public sealed class RetrievalTools(IRetrievalQueryService queryService)
{
    private readonly IRetrievalQueryService _queryService =
        queryService ?? throw new ArgumentNullException(nameof(queryService));

    public Task<IReadOnlyList<RetrievalMcpToolHit>> PolicyPackSearchAsync(
        RetrievalMcpToolRequest request,
        CancellationToken cancellationToken) =>
        SearchAsync(
            request with { IncludePlatformCorpora = true, CorpusKindFilter = CorpusKind.PolicyPack },
            new HashSet<Guid>(),
            cancellationToken);

    public Task<IReadOnlyList<RetrievalMcpToolHit>> PriorDecisionSearchAsync(
        RetrievalMcpToolRequest request,
        IReadOnlySet<Guid> authorizedEvidenceRunIds,
        CancellationToken cancellationToken) =>
        SearchAsync(
            request with { IncludePlatformCorpora = false, CorpusKindFilter = CorpusKind.PriorManifest },
            authorizedEvidenceRunIds,
            cancellationToken);

    public Task<IReadOnlyList<RetrievalMcpToolHit>> PriceRowLookupAsync(
        RetrievalMcpToolRequest request,
        CancellationToken cancellationToken) =>
        SearchAsync(
            request with { IncludePlatformCorpora = true, CorpusKindFilter = CorpusKind.AzureRetailPrice },
            new HashSet<Guid>(),
            cancellationToken);

    private async Task<IReadOnlyList<RetrievalMcpToolHit>> SearchAsync(
        RetrievalMcpToolRequest request,
        IReadOnlySet<Guid> authorizedEvidenceRunIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(authorizedEvidenceRunIds);
        if (request.TenantId == Guid.Empty || request.WorkspaceId == Guid.Empty || request.ProjectId == Guid.Empty)
            throw new ArgumentException("Complete tenant/workspace/project scope is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.QueryText))
            throw new ArgumentException("QueryText is required.", nameof(RetrievalMcpToolRequest.QueryText));

        cancellationToken.ThrowIfCancellationRequested();

        if (request.CorpusKindFilter == CorpusKind.PriorManifest &&
            !authorizedEvidenceRunIds.Any(id => id != Guid.Empty))
            return [];

        int requestedTopK = Math.Clamp(request.TopK, 1, 25);
        int searchTopK = request.CorpusKindFilter.HasValue ? 25 : requestedTopK;

        RetrievalQuery query = new()
        {
            TenantId = request.TenantId,
            WorkspaceId = request.WorkspaceId,
            ProjectId = request.ProjectId,
            QueryText = request.QueryText,
            TopK = searchTopK,
            IncludePlatformCorpora = request.IncludePlatformCorpora,
            CorpusKindFilter = request.CorpusKindFilter,
            AuthorizedEvidenceRunIds = authorizedEvidenceRunIds.Where(id => id != Guid.Empty).ToHashSet()
        };

        IReadOnlyList<RetrievalHit> hits = await _queryService.SearchAsync(query, cancellationToken);

        IEnumerable<RetrievalHit> filtered = hits;

        if (request.CorpusKindFilter.HasValue)
        {
            string kindName = request.CorpusKindFilter.Value.ToString();

            filtered = hits.Where(h =>
                string.Equals(h.CorpusKind, kindName, StringComparison.OrdinalIgnoreCase));
        }

        return filtered
            .Take(requestedTopK)
            .Select(static h =>
            {
                string text = h.Text ?? string.Empty;

                return new RetrievalMcpToolHit
                {
                    DocumentId = h.DocumentId ?? string.Empty,
                    CorpusKind = h.CorpusKind ?? string.Empty,
                    SourceType = h.SourceType ?? string.Empty,
                    SourceId = h.SourceId ?? string.Empty,
                    Title = h.Title ?? string.Empty,
                    Snippet = text.Length > 400 ? text[..400] : text,
                    Score = h.Score
                };
            })
            .ToList();
    }
}

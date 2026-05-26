using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Models;

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
            cancellationToken);

    public Task<IReadOnlyList<RetrievalMcpToolHit>> PriorDecisionSearchAsync(
        RetrievalMcpToolRequest request,
        CancellationToken cancellationToken) =>
        SearchAsync(
            request with { IncludePlatformCorpora = false, CorpusKindFilter = CorpusKind.PriorManifest },
            cancellationToken);

    public Task<IReadOnlyList<RetrievalMcpToolHit>> PriceRowLookupAsync(
        RetrievalMcpToolRequest request,
        CancellationToken cancellationToken) =>
        SearchAsync(
            request with { IncludePlatformCorpora = true, CorpusKindFilter = CorpusKind.AzureRetailPrice },
            cancellationToken);

    private async Task<IReadOnlyList<RetrievalMcpToolHit>> SearchAsync(
        RetrievalMcpToolRequest request,
        CancellationToken cancellationToken)
    {
        if (request.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(request));

        RetrievalQuery query = new()
        {
            TenantId = request.TenantId,
            WorkspaceId = request.WorkspaceId,
            ProjectId = request.ProjectId,
            QueryText = request.QueryText,
            TopK = Math.Clamp(request.TopK, 1, 25),
            IncludePlatformCorpora = request.IncludePlatformCorpora
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
            .Select(static h => new RetrievalMcpToolHit
            {
                DocumentId = h.DocumentId,
                CorpusKind = h.CorpusKind,
                SourceType = h.SourceType,
                SourceId = h.SourceId,
                Title = h.Title,
                Snippet = h.Text.Length > 400 ? h.Text[..400] : h.Text,
                Score = h.Score
            })
            .ToList();
    }
}

using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Retrieval;

using ArchLucid.Retrieval.Models;

using Azure;
using Azure.Identity;
using Azure.Search.Documents;
using Azure.Search.Documents.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Production <see cref="IAzureSearchClient" /> that applies <see cref="AzureSearchTenantScopeFilterBuilder" /> on every search (TB-071).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Requires Azure AI Search endpoint; exercised via filter builder unit tests and optional integration.")]
public sealed class AzureSearchSdkClient(IOptionsMonitor<AzureSearchOptions> options) : IAzureSearchClient
{
    private readonly IOptionsMonitor<AzureSearchOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    /// <inheritdoc />
    public bool IsConfigured => TryCreateSearchClient(out _);

    /// <inheritdoc />
    public Task UpsertChunksAsync(IReadOnlyList<RetrievalChunk> chunks, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(chunks);

        if (!TryCreateSearchClient(out SearchClient? client) || client is null)
            throw new InvalidOperationException("Azure AI Search is not configured.");

        List<SearchDocument> documents = chunks.Select(ToSearchDocument).ToList();

        return client.IndexDocumentsAsync(IndexDocumentsBatch.Upload(documents), cancellationToken: ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> SearchAsync(
        RetrievalQuery query,
        float[] queryEmbedding,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(queryEmbedding);

        if (!TryCreateSearchClient(out SearchClient? client) || client is null)
            throw new InvalidOperationException("Azure AI Search is not configured.");

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);
        AzureSearchQueryTelemetry.LastScopeFilter = filter;

        SearchOptions searchOptions = new()
        {
            Filter = filter,
            Size = query.TopK,
            Select = { "chunkId", "documentId", "corpusKind", "sourceType", "sourceId", "title", "text", "decisionId", "findingId" },
        };

        searchOptions.VectorSearch = new VectorSearchOptions
        {
            Queries = { new VectorizedQuery(queryEmbedding) { KNearestNeighborsCount = query.TopK, Fields = { "embedding" } } }
        };

        SearchResults<SearchDocument> results = await client.SearchAsync<SearchDocument>(null, searchOptions, ct)
            .ConfigureAwait(false);

        List<RetrievalHit> hits = [];

        await foreach (SearchResult<SearchDocument> result in results.GetResultsAsync().WithCancellation(ct))
        {
            SearchDocument doc = result.Document;
            hits.Add(
                new RetrievalHit
                {
                    ChunkId = doc.GetString("chunkId") ?? string.Empty,
                    DocumentId = doc.GetString("documentId") ?? string.Empty,
                    CorpusKind = doc.GetString("corpusKind") ?? string.Empty,
                    SourceType = doc.GetString("sourceType") ?? string.Empty,
                    SourceId = doc.GetString("sourceId") ?? string.Empty,
                    Title = doc.GetString("title") ?? string.Empty,
                    Text = doc.GetString("text") ?? string.Empty,
                    Score = (float)(result.Score ?? 0),
                    DecisionId = doc.GetString("decisionId"),
                    FindingId = doc.GetString("findingId")
                });
        }

        return hits;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RetrievalHit>> SemanticRerankAsync(
        string queryText,
        IReadOnlyList<RetrievalHit> candidates,
        int finalTopK,
        CancellationToken ct)
    {
        _ = queryText;
        _ = ct;

        IReadOnlyList<RetrievalHit> ranked = candidates
            .OrderByDescending(static hit => hit.Score)
            .Take(finalTopK)
            .ToList();

        return Task.FromResult(ranked);
    }

    /// <summary>Deletes chunks for <paramref name="documentId" /> within the OData scope filter.</summary>
    public async Task RemoveChunksForDocumentAsync(string documentId, RetrievalQuery scope, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(documentId);
        ArgumentNullException.ThrowIfNull(scope);

        if (!TryCreateSearchClient(out SearchClient? client) || client is null)
            return;

        string scopeFilter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(scope);
        string documentFilter = $"documentId eq '{EscapeOData(documentId)}'";
        string combined = $"({scopeFilter}) and ({documentFilter})";

        SearchOptions options = new() { Filter = combined, Select = { "chunkId" }, Size = 1000 };

        List<string> chunkIds = [];

        SearchResults<SearchDocument> results = await client.SearchAsync<SearchDocument>(null, options, ct)
            .ConfigureAwait(false);

        await foreach (SearchResult<SearchDocument> result in results.GetResultsAsync().WithCancellation(ct))
        {
            string? chunkId = result.Document.GetString("chunkId");

            if (!string.IsNullOrWhiteSpace(chunkId))
                chunkIds.Add(chunkId);
        }

        if (chunkIds.Count == 0)
            return;

        await client.DeleteDocumentsAsync("chunkId", chunkIds, cancellationToken: ct).ConfigureAwait(false);
    }

    private bool TryCreateSearchClient(out SearchClient? client)
    {
        client = null;
        AzureSearchOptions current = _options.CurrentValue;
        string? endpoint = current.Endpoint?.Trim();
        string? indexName = current.IndexName?.Trim();

        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(indexName))
            return false;

        Uri serviceUri = new(endpoint);
        string? apiKey = current.ApiKey?.Trim();

        if (!string.IsNullOrEmpty(apiKey))
        {
            client = new SearchClient(serviceUri, indexName, new AzureKeyCredential(apiKey));
            return true;
        }

        client = new SearchClient(serviceUri, indexName, new DefaultAzureCredential());
        return true;
    }

    private static SearchDocument ToSearchDocument(RetrievalChunk chunk)
    {
        SearchDocument document = new()
        {
            ["chunkId"] = chunk.ChunkId,
            ["documentId"] = chunk.DocumentId,
            ["tenantId"] = chunk.TenantId.ToString("D"),
            ["workspaceId"] = chunk.WorkspaceId.ToString("D"),
            ["projectId"] = chunk.ProjectId.ToString("D"),
            ["corpusKind"] = chunk.CorpusKind.ToString(),
            ["sourceType"] = chunk.SourceType,
            ["sourceId"] = chunk.SourceId,
            ["title"] = chunk.Title,
            ["text"] = chunk.Text,
            ["embedding"] = chunk.Embedding
        };

        if (chunk.RunId is Guid runId)
            document["runId"] = runId.ToString("D");

        if (chunk.ManifestId is Guid manifestId)
            document["manifestId"] = manifestId.ToString("D");

        if (!string.IsNullOrWhiteSpace(chunk.DecisionId))
            document["decisionId"] = chunk.DecisionId;

        if (!string.IsNullOrWhiteSpace(chunk.FindingId))
            document["findingId"] = chunk.FindingId;

        if (!string.IsNullOrWhiteSpace(chunk.PolicyPackRulePackId))
            document["policyPackRulePackId"] = chunk.PolicyPackRulePackId;

        return document;
    }

    private static string EscapeOData(string value) => value.Replace("'", "''", StringComparison.Ordinal);
}

/// <summary>Test and diagnostics hook for the last OData filter applied by <see cref="AzureSearchSdkClient" />.</summary>
public static class AzureSearchQueryTelemetry
{
    public static string? LastScopeFilter
    {
        get;
        set;
    }
}

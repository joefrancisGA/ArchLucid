using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;

namespace ArchLucid.Retrieval.Queries;

/// <summary>
///     <see cref="IRetrievalQueryService" /> implementation: embed query text, delegate to <see cref="IVectorIndex" />.
/// </summary>
public sealed class RetrievalQueryService(
    IEmbeddingService embeddingService,
    IVectorIndex vectorIndex,
    AssignedPolicyPackRulePackIdResolver assignedPolicyPackRulePackIdResolver) : IRetrievalQueryService
{
    private readonly AssignedPolicyPackRulePackIdResolver _assignedPolicyPackRulePackIdResolver =
        assignedPolicyPackRulePackIdResolver ?? throw new ArgumentNullException(nameof(assignedPolicyPackRulePackIdResolver));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> SearchAsync(RetrievalQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentException.ThrowIfNullOrWhiteSpace(query.QueryText);

        if (query.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required for tenant-bound retrieval.", nameof(query));

        if (query.IncludePlatformCorpora && query.AllowedPolicyPackRulePackIds is null)
        {
            HashSet<string> assigned = await _assignedPolicyPackRulePackIdResolver
                .ResolveAsync(query.TenantId, query.WorkspaceId, query.ProjectId, ct)
                .ConfigureAwait(false);

            query.AllowedPolicyPackRulePackIds = assigned;
        }

        long startTicks = Stopwatch.GetTimestamp();

        float[] embedding = await embeddingService.EmbedAsync(query.QueryText, ct);
        IReadOnlyList<RetrievalHit> hits = await vectorIndex.SearchAsync(query, embedding, ct);

        double durationMilliseconds = Stopwatch.GetElapsedTime(startTicks).TotalMilliseconds;
        ArchLucidInstrumentation.RecordRagRetrievalSearch(durationMilliseconds, hits, query.TenantId);

        return hits;
    }
}

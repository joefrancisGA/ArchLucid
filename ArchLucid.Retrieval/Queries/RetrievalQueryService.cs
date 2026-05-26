using System.Diagnostics;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Options;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.PolicyPacks;

namespace ArchLucid.Retrieval.Queries;

/// <summary>
///     <see cref="IRetrievalQueryService" /> implementation: embed query text, delegate to <see cref="IVectorIndex" />.
/// </summary>
public sealed class RetrievalQueryService(
    IEmbeddingService embeddingService,
    IVectorIndex vectorIndex,
    AssignedPolicyPackRulePackIdResolver assignedPolicyPackRulePackIdResolver,
    IOptionsMonitor<RetrievalTelemetryOptions> retrievalTelemetryOptions) : IRetrievalQueryService
{
    private readonly AssignedPolicyPackRulePackIdResolver _assignedPolicyPackRulePackIdResolver =
        assignedPolicyPackRulePackIdResolver ?? throw new ArgumentNullException(nameof(assignedPolicyPackRulePackIdResolver));

    private readonly IOptionsMonitor<RetrievalTelemetryOptions> _retrievalTelemetryOptions =
        retrievalTelemetryOptions ?? throw new ArgumentNullException(nameof(retrievalTelemetryOptions));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> SearchAsync(RetrievalQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentException.ThrowIfNullOrWhiteSpace(query.QueryText);

        if (query.TenantId == Guid.Empty && !query.IncludePlatformCorpora)
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
        bool recordPerTenantTags = _retrievalTelemetryOptions.CurrentValue.RecordPerTenantTags;
        ArchLucidInstrumentation.RecordRagRetrievalSearch(
            durationMilliseconds,
            hits,
            query.TenantId,
            recordPerTenantTags);

        return hits;
    }
}

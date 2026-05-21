using System.Collections.Concurrent;

using ArchLucid.Core.Search;

namespace ArchLucid.Persistence.Search;

public sealed class InMemoryGlobalSearchRepository : IGlobalSearchRepository
{
    public Task<GlobalSearchResult> SearchAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string query,
        int takePerCategory,
        CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = workspaceId;
        _ = projectId;
        _ = cancellationToken;

        if (string.IsNullOrWhiteSpace(query))
            return Task.FromResult(new GlobalSearchResult());

        string needle = query.Trim();

        return Task.FromResult(new GlobalSearchResult());
    }
}

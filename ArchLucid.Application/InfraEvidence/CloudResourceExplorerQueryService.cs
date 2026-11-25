using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public interface ICloudResourceExplorerQueryService
{
    Task<PagedResponse<CloudResourceSummary>> ListCloudResourcesAsync(
        ScopeContext scope,
        string? namePrefix,
        string? resourceType,
        string? resourceGroup,
        CloudResourceExplorerWorkQueue workQueue,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}

public sealed class CloudResourceExplorerQueryService(ICloudResourceIdentityDirectory identityDirectory)
    : ICloudResourceExplorerQueryService
{
    public async Task<PagedResponse<CloudResourceSummary>> ListCloudResourcesAsync(
        ScopeContext scope,
        string? namePrefix,
        string? resourceType,
        string? resourceGroup,
        CloudResourceExplorerWorkQueue workQueue,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (IReadOnlyList<CloudResourceExplorerListItem> items, int totalCount) =
            await identityDirectory.ListForExplorerAsync(
                scope,
                namePrefix,
                resourceType,
                resourceGroup,
                workQueue,
                page,
                pageSize,
                cancellationToken);

        List<CloudResourceSummary> summaries = items
            .Select(row => new CloudResourceSummary
            {
                CloudResourceId = row.Identity.CloudResourceId,
                ExternalResourceId = row.Identity.ExternalResourceIdNormalized,
                DisplayName = string.IsNullOrWhiteSpace(row.Identity.DisplayName)
                    ? GetResourceName(row.Identity.ExternalResourceIdNormalized)
                    : row.Identity.DisplayName,
                ResourceType = row.Identity.ResourceType,
                ResourceGroup = row.Identity.ResourceGroupOrProject,
                Region = row.Identity.Region,
                LastSeenUtc = row.Identity.LastSeenUtc,
                WorkCounts = row.WorkCounts,
            })
            .ToList();

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);

        return PagedResponseBuilder.FromDatabasePage(summaries, totalCount, safePage, safePageSize);
    }

    private static string? GetResourceName(string normalizedResourceId)
    {
        int start = normalizedResourceId.LastIndexOf('/') + 1;
        return start < normalizedResourceId.Length ? normalizedResourceId[start..] : null;
    }
}

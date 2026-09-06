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

        (IReadOnlyList<CloudResourceIdentityRecord> items, int totalCount) =
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
                CloudResourceId = row.CloudResourceId,
                ExternalResourceId = row.ExternalResourceIdNormalized,
                DisplayName = row.DisplayName,
                ResourceType = row.ResourceType,
                ResourceGroup = row.ResourceGroupOrProject,
                Region = row.Region,
                LastSeenUtc = row.LastSeenUtc,
            })
            .ToList();

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);

        return PagedResponseBuilder.FromDatabasePage(summaries, totalCount, safePage, safePageSize);
    }
}

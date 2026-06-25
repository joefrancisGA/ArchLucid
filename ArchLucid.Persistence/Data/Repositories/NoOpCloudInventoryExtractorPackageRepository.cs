using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory hosts: uploaded AWS/GCP inventory ZIPs are not persisted to SQL.</summary>
public sealed class NoOpCloudInventoryExtractorPackageRepository : ICloudInventoryExtractorPackageRepository
{
    public Task InsertAsync(CloudInventoryExtractorPackageRecord record, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<CloudInventoryExtractorPackageDownloadRecord?> TryGetDownloadByPackageIdAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        Guid packageId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<CloudInventoryExtractorPackageDownloadRecord?>(null);
}

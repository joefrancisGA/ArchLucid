using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

public interface ICloudInventoryExtractorPackageRepository
{
    Task InsertAsync(CloudInventoryExtractorPackageRecord record, CancellationToken cancellationToken = default);

    Task<CloudInventoryExtractorPackageDownloadRecord?> TryGetDownloadByPackageIdAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        Guid packageId,
        CancellationToken cancellationToken = default);
}

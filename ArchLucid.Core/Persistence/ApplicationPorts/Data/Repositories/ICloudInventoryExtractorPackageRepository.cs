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

    /// <summary>Latest AWS/GCP inventory package provenance linked to a run (no ZIP bytes).</summary>
    Task<CloudInventoryExtractorPackageProvenance?> TryGetLatestProvenanceByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default);

    /// <summary>Latest collection timestamp for scoped AWS/GCP inventory packages (TB-2218 / TB-2219).</summary>
    Task<DateTime?> TryGetLatestCollectionTimestampUtcInScopeAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default);

    /// <summary>Latest AWS/GCP inventory ZIP bytes in the active scope (TB-2218).</summary>
    Task<CloudInventoryExtractorPackageDownloadRecord?> TryGetLatestDownloadInScopeAsync(
        ScopeContext scope,
        CloudProvider cloudProvider,
        CancellationToken cancellationToken = default);
}

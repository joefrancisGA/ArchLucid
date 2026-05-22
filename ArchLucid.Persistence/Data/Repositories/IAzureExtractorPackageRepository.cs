using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IAzureExtractorPackageRepository
{
    Task InsertAsync(AzureExtractorPackageRecord record, CancellationToken cancellationToken = default);

    Task<AzureExtractorPackageProvenance?> TryGetLatestProvenanceByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);

    Task<DateTime?> TryGetLatestCollectionTimestampUtcInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    /// <summary>True when at least one persisted extractor package exists for the scoped tenant and workspace.</summary>
    Task<bool> HasAnyInWorkspaceAsync(ScopeContext scope, CancellationToken cancellationToken = default);

    Task<AzureExtractorPackageDownloadRecord?> TryGetDownloadByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default);
}

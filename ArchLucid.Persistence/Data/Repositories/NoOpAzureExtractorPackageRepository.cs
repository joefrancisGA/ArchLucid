using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory hosts: uploaded Azure extractor ZIPs are not persisted to SQL.</summary>
public sealed class NoOpAzureExtractorPackageRepository : IAzureExtractorPackageRepository
{
    public Task InsertAsync(AzureExtractorPackageRecord record, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<AzureExtractorPackageProvenance?> TryGetLatestProvenanceByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureExtractorPackageProvenance?>(null);

    public Task<bool> HasAnyInWorkspaceAsync(ScopeContext scope, CancellationToken cancellationToken = default)
        => Task.FromResult(false);

    public Task<DateTime?> TryGetLatestCollectionTimestampUtcInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
        => Task.FromResult<DateTime?>(null);

    public Task<AzureExtractorPackageDownloadRecord?> TryGetDownloadByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureExtractorPackageDownloadRecord?>(null);

    public Task<AzureExtractorPackageDownloadRecord?> TryGetLatestDownloadInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureExtractorPackageDownloadRecord?>(null);

    public Task<string?> TryGetLatestScriptVersionInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
        => Task.FromResult<string?>(null);
}

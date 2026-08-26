using ArchLucid.Core.AzureExtractor;
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

    /// <summary>True when at least one persisted extractor package exists for the scoped tenant, workspace, and project.</summary>
    Task<bool> HasAnyInWorkspaceAsync(ScopeContext scope, CancellationToken cancellationToken = default);

    /// <summary>Project-scoped baseline presence and latest script version in one round trip.</summary>
    Task<WorkspaceBaselineExtractorArtifacts> GetWorkspaceBaselineArtifactsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<AzureExtractorPackageDownloadRecord?> TryGetDownloadByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default);

    /// <summary>Latest scoped extractor ZIP bytes for inventory analytics (resource coverage).</summary>
    Task<AzureExtractorPackageDownloadRecord?> TryGetLatestDownloadInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    /// <summary>Script version from the newest scoped extractor package manifest, when present.</summary>
    Task<string?> TryGetLatestScriptVersionInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}

using ArchiForge.Core.Scoping;

namespace ArchiForge.Persistence.Compare;

public interface IAuthorityCompareService
{
    Task<ManifestComparisonResult?> CompareManifestsAsync(
        ScopeContext scope,
        Guid leftManifestId,
        Guid rightManifestId,
        CancellationToken ct);

    Task<RunComparisonResult?> CompareRunsAsync(
        ScopeContext scope,
        Guid leftRunId,
        Guid rightRunId,
        CancellationToken ct);
}

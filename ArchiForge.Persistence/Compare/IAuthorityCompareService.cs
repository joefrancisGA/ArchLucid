namespace ArchiForge.Persistence.Compare;

public interface IAuthorityCompareService
{
    Task<ManifestComparisonResult?> CompareManifestsAsync(
        Guid leftManifestId,
        Guid rightManifestId,
        CancellationToken ct);

    Task<RunComparisonResult?> CompareRunsAsync(
        Guid leftRunId,
        Guid rightRunId,
        CancellationToken ct);
}

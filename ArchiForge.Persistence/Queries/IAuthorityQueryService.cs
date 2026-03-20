namespace ArchiForge.Persistence.Queries;

public interface IAuthorityQueryService
{
    Task<IReadOnlyList<RunSummaryDto>> ListRunsByProjectAsync(
        string projectId,
        int take,
        CancellationToken ct);

    Task<RunSummaryDto?> GetRunSummaryAsync(
        Guid runId,
        CancellationToken ct);

    Task<RunDetailDto?> GetRunDetailAsync(
        Guid runId,
        CancellationToken ct);

    Task<ManifestSummaryDto?> GetManifestSummaryAsync(
        Guid manifestId,
        CancellationToken ct);
}

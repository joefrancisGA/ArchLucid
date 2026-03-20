using ArchiForge.Core.Scoping;

namespace ArchiForge.Persistence.Queries;

public interface IAuthorityQueryService
{
    Task<IReadOnlyList<RunSummaryDto>> ListRunsByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct);

    Task<RunSummaryDto?> GetRunSummaryAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct);

    Task<RunDetailDto?> GetRunDetailAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct);

    Task<ManifestSummaryDto?> GetManifestSummaryAsync(
        ScopeContext scope,
        Guid manifestId,
        CancellationToken ct);
}

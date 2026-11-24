using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Findings;

/// <summary>Batch read of ITSM linkage and governance disposition for run findings export (TB-386).</summary>
public interface IRunFindingExternalTrackingReadRepository
{
    /// <summary>Exact authorized run projection; never fall back to a tenant-wide finding ID lookup.</summary>
    Task<IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow>> ListForAuthorizedRunFindingsAsync(
        ScopeContext scope, Guid runId, IReadOnlyList<string> findingIds, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow>>(
            new Dictionary<string, RunFindingExternalTrackingReadRow>(StringComparer.Ordinal));

    Task<IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow>> ListForFindingsAsync(
        Guid tenantId,
        Guid? findingsSnapshotId,
        IReadOnlyList<string> findingIds,
        CancellationToken cancellationToken);
}

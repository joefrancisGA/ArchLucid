namespace ArchLucid.Core.Persistence.ApplicationPorts.Findings;

/// <summary>Batch read of ITSM linkage and governance disposition for run findings export (TB-386).</summary>
public interface IRunFindingExternalTrackingReadRepository
{
    Task<IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow>> ListForFindingsAsync(
        Guid tenantId,
        Guid? findingsSnapshotId,
        IReadOnlyList<string> findingIds,
        CancellationToken cancellationToken);
}

namespace ArchLucid.Application.Roi;

/// <summary>Resolves run-level estimated USD savings using tenant cost settings when configured.</summary>
public interface ITenantEstimatedUsdSavingsResolver
{
    Task<decimal?> ResolveFromFindingsSnapshotIdAsync(Guid? findingsSnapshotId, CancellationToken cancellationToken);
}

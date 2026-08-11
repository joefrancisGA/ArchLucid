namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>Acquires and releases per-run execute ownership leases (TB-943).</summary>
public interface IRunExecuteOwnershipLeaseService
{
    bool IsEnabled { get; }

    /// <summary>Throws <see cref="ArchLucid.Contracts.Common.ConflictException" /> when another holder owns a live lease.</summary>
    Task AcquireAsync(Guid runId, CancellationToken cancellationToken);

    Task ReleaseAsync(Guid runId, CancellationToken cancellationToken);

    /// <summary>TB-961: release every lease held by this process instance.</summary>
    Task<int> ReleaseAllHeldByThisInstanceAsync(CancellationToken cancellationToken);
}

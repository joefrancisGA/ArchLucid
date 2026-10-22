namespace ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;

/// <summary>
/// SQL-backed lease rows for agent execute ownership (TB-943). One lease per <see cref="Guid"/> run id.
/// </summary>
public interface IRunExecuteOwnershipLeaseRepository
{
    /// <summary>
    /// Acquires or renews the lease when unheld or held by the same instance. Returns false when another live holder owns it.
    /// </summary>
    Task<bool> TryAcquireOrRenewAsync(
        Guid runId,
        string holderInstanceId,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default);

    /// <summary>Releases the lease when held by <paramref name="holderInstanceId" />.</summary>
    Task TryReleaseAsync(Guid runId, string holderInstanceId, CancellationToken cancellationToken = default);

    /// <summary>Releases all leases held by <paramref name="holderInstanceId" /> (TB-961 shutdown drain).</summary>
    Task<int> ReleaseAllHeldByInstanceAsync(string holderInstanceId, CancellationToken cancellationToken = default);

    /// <summary>Lists run ids whose lease expired before <paramref name="asOfUtc" />.</summary>
    Task<IReadOnlyList<Guid>> ListExpiredRunIdsAsync(DateTimeOffset asOfUtc, int maxRows, CancellationToken cancellationToken = default);

    /// <summary>Deletes the lease row regardless of holder (post-reconciliation cleanup).</summary>
    Task TryDeleteAsync(Guid runId, CancellationToken cancellationToken = default);
}

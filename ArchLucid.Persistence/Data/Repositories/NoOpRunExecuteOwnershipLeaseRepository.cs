using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>No-op lease repository for InMemory storage hosts.</summary>
public sealed class NoOpRunExecuteOwnershipLeaseRepository : IRunExecuteOwnershipLeaseRepository
{
    /// <inheritdoc />
    public Task<bool> TryAcquireOrRenewAsync(
        Guid runId,
        string holderInstanceId,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(true);

    /// <inheritdoc />
    public Task TryReleaseAsync(Guid runId, string holderInstanceId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    /// <inheritdoc />
    public Task<int> ReleaseAllHeldByInstanceAsync(string holderInstanceId, CancellationToken cancellationToken = default) =>
        Task.FromResult(0);

    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListExpiredRunIdsAsync(
        DateTimeOffset asOfUtc,
        int maxRows,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<Guid>>([]);

    /// <inheritdoc />
    public Task TryDeleteAsync(Guid runId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

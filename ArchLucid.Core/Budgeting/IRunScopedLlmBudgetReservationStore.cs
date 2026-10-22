namespace ArchLucid.Core.Budgeting;

/// <summary>Atomic tenant-scoped pending reservation store for run agent batches (TB-939).</summary>
public interface IRunScopedLlmBudgetReservationStore
{
    Task<RunScopedLlmBudgetReservationStoreResult> TryReserveAsync(
        RunScopedLlmBudgetReservationRequest request,
        CancellationToken cancellationToken = default);

    Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default);

    Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default);
}

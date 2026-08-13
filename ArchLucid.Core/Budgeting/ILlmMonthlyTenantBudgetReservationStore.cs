namespace ArchLucid.Core.Budgeting;

/// <summary>
///     Durable per-call monthly USD reservation leases (TB-976). Production hosts use SQL; in-memory hosts use a
///     process-local implementation for tests.
/// </summary>
public interface ILlmMonthlyTenantBudgetReservationStore
{
    Task<LlmMonthlyTenantBudgetReservationStoreResult> TryReserveAsync(
        LlmMonthlyTenantBudgetReservationRequest request,
        CancellationToken cancellationToken = default);

    Task<LlmMonthlyTenantBudgetReservationSettleResult> SettleAsync(
        Guid reservationId,
        decimal actualUsd,
        decimal warnAtUsd,
        CancellationToken cancellationToken = default);

    Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default);

    Task<LlmMonthlyTenantBudgetReclaimResult> ReclaimExpiredBatchAsync(
        CancellationToken cancellationToken = default);

    Task<bool> ReconcileUnsettledAsync(
        Guid reservationId,
        decimal actualUsd,
        decimal warnAtUsd,
        CancellationToken cancellationToken = default);
}

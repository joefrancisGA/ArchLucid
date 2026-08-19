using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

/// <summary>Test/host helper that skips TB-939 admit/reserve (always pass-through).</summary>
public sealed class PassThroughRunScopedLlmBudgetReservationService : IRunScopedLlmBudgetReservationService
{
    /// <inheritdoc />
    public Task<RunScopedLlmBudgetAdmitResult> AdmitBeforeAgentBatchAsync(
        Guid tenantId,
        string runId,
        int agentTaskCount,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);

        return Task.FromResult(RunScopedLlmBudgetAdmitResult.PassThrough());
    }

    /// <inheritdoc />
    public Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    /// <inheritdoc />
    public Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

public interface IRunScopedLlmBudgetReservationService
{
    Task<RunScopedLlmBudgetAdmitResult> AdmitBeforeAgentBatchAsync(
        Guid tenantId,
        string runId,
        int agentTaskCount,
        CancellationToken cancellationToken = default);

    Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default);

    Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default);
}

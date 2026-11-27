using ArchLucid.Core.Transactions;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

public interface IAnalysisRecoveryRepository
{
    Task<AnalysisRecoveryClaim?> ReadAsync(AnalysisRecoveryStageKey key, CancellationToken cancellationToken);

    /// <summary>Acquires a new or reclaimable stage, or returns its current non-owned state.</summary>
    Task<AnalysisRecoveryClaim> ClaimAsync(
        AnalysisRecoveryStageKey key, string inputVersion, Guid owner, int leaseSeconds, int maxAttempts,
        CancellationToken cancellationToken);

    Task<bool> RenewAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, int leaseSeconds, CancellationToken cancellationToken);

    /// <summary>Publishes the checkpoint under the same transaction as authoritative output where possible.</summary>
    Task<bool> CompleteAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, string resultReference,
        IArchLucidUnitOfWork? unitOfWork, CancellationToken cancellationToken);

    Task<bool> ReleaseAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, bool retryable, CancellationToken cancellationToken);
}

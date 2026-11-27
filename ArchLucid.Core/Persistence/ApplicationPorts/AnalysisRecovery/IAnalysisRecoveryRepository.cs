using ArchLucid.Core.Transactions;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

public interface IAnalysisRecoveryRepository
{
    Task<AnalysisRecoveryClaim?> ReadAsync(AnalysisRecoveryStageKey key, CancellationToken cancellationToken);

    /// <summary>Acquires a new or reclaimable stage, or returns its current non-owned state.</summary>
    Task<AnalysisRecoveryClaim> ClaimAsync(
        AnalysisRecoveryStageKey key, string inputVersion, Guid owner, int leaseSeconds, int maxAttempts,
        CancellationToken cancellationToken);

    /// <summary>Replaces an incompatible, inactive checkpoint only while its Authority run is unsealed.</summary>
    Task<AnalysisRecoveryClaim> ClaimForAuthorityInputsAsync(
        AnalysisRecoveryStageKey key, string inputVersion, Guid owner, int leaseSeconds, int maxAttempts,
        CancellationToken cancellationToken);

    /// <summary>Checks and locks the dependency in the consumer's publication transaction.</summary>
    Task<bool> IsCurrentAsync(AnalysisRecoveryStageKey key, string inputVersion, string resultReference,
        IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken);

    Task<bool> RenewAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, int leaseSeconds, CancellationToken cancellationToken);

    /// <summary>Publishes the checkpoint under the same transaction as authoritative output where possible.</summary>
    Task<bool> CompleteAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, string resultReference,
        IArchLucidUnitOfWork? unitOfWork, CancellationToken cancellationToken);

    /// <summary>Releases a terminal lease with a sanitized dependency reason, not an output reference.</summary>
    Task<bool> ReleaseWithCoverageReasonAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, string reason, CancellationToken cancellationToken);

    Task<bool> ReleaseAsync(
        AnalysisRecoveryStageKey key, Guid owner, long fence, bool retryable, CancellationToken cancellationToken);
}

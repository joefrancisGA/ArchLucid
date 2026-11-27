using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

public interface ISecureNowAnalysisRecoveryJobs
{
    Task<SecureNowAnalysisRecoveryJob> AdmitAsync(
        ProjectScopeKey scope, Guid snapshotId, string? subscriptionId, bool fullRecompute, string inputVersion,
        DateTime admittedUtc, DateTime deadlineUtc, CancellationToken cancellationToken);

    Task<IReadOnlyList<SecureNowAnalysisRecoveryJob>> ListPendingAsync(Guid tenantId, CancellationToken cancellationToken);

    Task RecordOutcomeAsync(SecureNowAnalysisRecoveryJob job, string outcome, CancellationToken cancellationToken);
}

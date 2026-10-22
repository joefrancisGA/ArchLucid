using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public interface ISecureNowArchitectNeighborhoodRunner
{
    Task<SecureNowArchitectNeighborhoodRecomputeResult> RecomputeNeighborhoodAsync(
        ScopeContext scope,
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        CancellationToken cancellationToken = default);

    Task<int> CarryForwardAllAsync(
        ScopeContext scope,
        Guid fromSnapshotId,
        Guid toSnapshotId,
        CancellationToken cancellationToken = default);
}

using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IInfraEvidenceDriftWorkbenchQueryService
{
    Task<PagedResponse<AzureInventorySnapshotRecord>> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AzureInventoryDiffSummaryRecord>?> ListDiffsForSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<AzureInventoryChangeRecord>?> ListChangesForDiffAsync(
        ScopeContext scope,
        Guid diffId,
        int page,
        int pageSize,
        Guid? cloudResourceId = null,
        CancellationToken cancellationToken = default);
}

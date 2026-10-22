using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAzureInventoryBaselineRepository
{
    Task InsertAsync(AzureInventoryBaselineRecord record, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AzureInventoryBaselineRecord>> ListByScopeAsync(
        ScopeContext scope,
        string? subscriptionId,
        CancellationToken cancellationToken = default);

    Task<AzureInventoryBaselineRecord?> TryGetLatestByKindAsync(
        ScopeContext scope,
        AzureInventoryBaselineKind baselineKind,
        string? subscriptionId,
        CancellationToken cancellationToken = default);
}

public interface IAzureInventoryDriftApprovalRepository
{
    Task InsertAsync(AzureInventoryDriftApprovalRecord record, CancellationToken cancellationToken = default);

    Task MarkExpiredAsync(Guid tenantId, DateTime asOfUtc, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AzureInventoryDriftApprovalRecord>> ListActiveForDiffAsync(
        ScopeContext scope,
        Guid diffId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);
}

public interface IAzureInventoryDiffNarrativeRepository
{
    Task InsertAsync(AzureInventoryDiffNarrativeRecord record, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AzureInventoryDiffNarrativeRecord>> ListByDiffIdAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default);
}

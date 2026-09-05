using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAzureInventoryBaselineRepository : IAzureInventoryBaselineRepository
{
    public Task InsertAsync(AzureInventoryBaselineRecord record, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<IReadOnlyList<AzureInventoryBaselineRecord>> ListByScopeAsync(
        ScopeContext scope,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AzureInventoryBaselineRecord>>([]);

    public Task<AzureInventoryBaselineRecord?> TryGetLatestByKindAsync(
        ScopeContext scope,
        AzureInventoryBaselineKind baselineKind,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureInventoryBaselineRecord?>(null);
}

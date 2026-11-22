using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAzureInventoryDriftApprovalRepository : IAzureInventoryDriftApprovalRepository
{
    public Task InsertAsync(AzureInventoryDriftApprovalRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task MarkExpiredAsync(Guid tenantId, DateTime asOfUtc, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AzureInventoryDriftApprovalRecord>> ListActiveForDiffAsync(
        ScopeContext scope,
        Guid diffId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<AzureInventoryDriftApprovalRecord>>([]);
    }
}

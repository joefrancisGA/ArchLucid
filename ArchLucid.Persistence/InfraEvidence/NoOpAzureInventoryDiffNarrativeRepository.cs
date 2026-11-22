using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpAzureInventoryDiffNarrativeRepository : IAzureInventoryDiffNarrativeRepository
{
    public Task InsertAsync(AzureInventoryDiffNarrativeRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AzureInventoryDiffNarrativeRecord>> ListByDiffIdAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<AzureInventoryDiffNarrativeRecord>>([]);
    }
}

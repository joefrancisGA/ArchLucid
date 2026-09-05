using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Default no-op consumer until AE-09 wires evidence invalidation.</summary>
public sealed class NoOpAzureInventoryDiffConsumer : IAzureInventoryDiffConsumer
{
    public Task OnDiffComputedAsync(
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}

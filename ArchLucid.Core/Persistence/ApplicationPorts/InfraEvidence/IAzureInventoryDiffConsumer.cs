namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Consumer hook for ARC-AMPE evidence invalidation (AE-09). Empty adapter is sufficient for IE-06.</summary>
public interface IAzureInventoryDiffConsumer
{
    Task OnDiffComputedAsync(
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        CancellationToken cancellationToken = default);
}

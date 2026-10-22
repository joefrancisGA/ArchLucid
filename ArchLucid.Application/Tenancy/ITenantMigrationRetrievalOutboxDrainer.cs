namespace ArchLucid.Application.Tenancy;

/// <summary>Drains retrieval indexing outbox rows during post-cutover projection refresh.</summary>
public interface ITenantMigrationRetrievalOutboxDrainer
{
    Task<int> ProcessPendingBatchAsync(CancellationToken cancellationToken);
}

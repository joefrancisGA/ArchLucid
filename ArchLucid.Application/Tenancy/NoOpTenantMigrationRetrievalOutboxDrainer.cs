namespace ArchLucid.Application.Tenancy;

public sealed class NoOpTenantMigrationRetrievalOutboxDrainer : ITenantMigrationRetrievalOutboxDrainer
{
    public Task<int> ProcessPendingBatchAsync(CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return Task.FromResult(0);
    }
}

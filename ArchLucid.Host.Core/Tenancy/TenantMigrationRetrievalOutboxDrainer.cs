using ArchLucid.Application.Tenancy;
using ArchLucid.Persistence.Coordination.Retrieval;

namespace ArchLucid.Host.Core.Tenancy;

public sealed class TenantMigrationRetrievalOutboxDrainer(
    IRetrievalIndexingOutboxProcessor retrievalIndexingOutboxProcessor) : ITenantMigrationRetrievalOutboxDrainer
{
    private readonly IRetrievalIndexingOutboxProcessor _retrievalIndexingOutboxProcessor =
        retrievalIndexingOutboxProcessor ?? throw new ArgumentNullException(nameof(retrievalIndexingOutboxProcessor));

    public Task<int> ProcessPendingBatchAsync(CancellationToken cancellationToken) =>
        _retrievalIndexingOutboxProcessor.ProcessPendingBatchAsync(cancellationToken);
}

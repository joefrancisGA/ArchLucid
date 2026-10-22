using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Orchestration;

namespace ArchLucid.Persistence.Admin;

/// <inheritdoc cref="IAdminOutboxSnapshotReader" />
public sealed class InMemoryAdminOutboxSnapshotReader(
    IAuthorityPipelineWorkRepository authorityPipelineWork,
    IRetrievalIndexingOutboxRepository retrievalIndexingOutbox,
    IIntegrationEventOutboxRepository integrationEventOutbox) : IAdminOutboxSnapshotReader
{
    private readonly IAuthorityPipelineWorkRepository _authorityPipelineWork =
        authorityPipelineWork ?? throw new ArgumentNullException(nameof(authorityPipelineWork));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IRetrievalIndexingOutboxRepository _retrievalIndexingOutbox =
        retrievalIndexingOutbox ?? throw new ArgumentNullException(nameof(retrievalIndexingOutbox));

    /// <inheritdoc />
    public async Task<AdminOutboxSnapshotCounts> ReadAsync(CancellationToken cancellationToken = default)
    {
        long authorityPending = await _authorityPipelineWork.CountActionablePendingAsync(cancellationToken);
        long authorityDead = await _authorityPipelineWork.CountDeadLetteredAsync(cancellationToken);
        long retrievalPending = await _retrievalIndexingOutbox.CountPendingAsync(cancellationToken);
        long integrationPending =
            await _integrationEventOutbox.CountIntegrationOutboxPublishPendingAsync(cancellationToken);
        long integrationDead = await _integrationEventOutbox.CountIntegrationOutboxDeadLetterAsync(cancellationToken);

        return new AdminOutboxSnapshotCounts(
            authorityPending,
            authorityDead,
            retrievalPending,
            integrationPending,
            integrationDead);
    }
}

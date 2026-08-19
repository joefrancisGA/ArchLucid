namespace ArchLucid.Persistence.Coordination.Diagnostics;

/// <summary>Depth and age snapshot for transactional outboxes (Prometheus / operator dashboards).</summary>
public sealed class OutboxOperationalMetricsSnapshot
{
    public long AuthorityPipelineWorkPending
    {
        get;
        init;
    }

    public long AuthorityPipelineWorkDeadLetter
    {
        get;
        init;
    }

    public double AuthorityPipelineWorkOldestPendingAgeSeconds
    {
        get;
        init;
    }

    public long RetrievalIndexingOutboxPending
    {
        get;
        init;
    }

    public double RetrievalIndexingOutboxOldestPendingAgeSeconds
    {
        get;
        init;
    }

    public long RetrievalIndexingOutboxDeadLetter
    {
        get;
        init;
    }

    public long IntegrationEventOutboxPublishPending
    {
        get;
        init;
    }

    public long IntegrationEventOutboxDeadLetter
    {
        get;
        init;
    }

    public double IntegrationEventOutboxOldestActionablePendingAgeSeconds
    {
        get;
        init;
    }

    public long RunExportBlobPushOutboxPending
    {
        get;
        init;
    }

    public long RunExportBlobPushOutboxDeadLetter
    {
        get;
        init;
    }

    public double RunExportBlobPushOutboxOldestPendingAgeSeconds
    {
        get;
        init;
    }

    public long PostCommitProjectionOutboxPending
    {
        get;
        init;
    }

    public double PostCommitProjectionOutboxOldestPendingAgeSeconds
    {
        get;
        init;
    }

    public long PostCommitProjectionOutboxDeadLetter
    {
        get;
        init;
    }
}

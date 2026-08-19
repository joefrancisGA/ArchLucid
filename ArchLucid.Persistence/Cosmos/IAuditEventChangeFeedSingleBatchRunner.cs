namespace ArchLucid.Persistence.Cosmos;

/// <summary>Runs at most one change-feed batch (or idle wait) for audit events.</summary>
public interface IAuditEventChangeFeedSingleBatchRunner
{
    Task RunSingleBatchOrIdleAsync(TimeSpan maxIdleWait, CancellationToken cancellationToken);
}

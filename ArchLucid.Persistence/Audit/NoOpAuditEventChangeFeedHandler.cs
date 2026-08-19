using ArchLucid.Persistence.Cosmos;

namespace ArchLucid.Persistence.Audit;

/// <summary>Default no-op handler until product-specific side effects are wired.</summary>
public sealed class NoOpAuditEventChangeFeedHandler : IAuditEventChangeFeedHandler
{
    public Task HandleAsync(IReadOnlyList<AuditEventDocument> changes, CancellationToken cancellationToken)
    {
        _ = changes;
        return Task.CompletedTask;
    }
}

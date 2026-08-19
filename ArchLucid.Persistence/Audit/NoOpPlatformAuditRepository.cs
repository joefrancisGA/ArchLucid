using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

public sealed class NoOpPlatformAuditRepository : IPlatformAuditRepository
{
    public Task AppendAsync(PlatformAuditEvent auditEvent, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);
        _ = cancellationToken;

        return Task.CompletedTask;
    }
}

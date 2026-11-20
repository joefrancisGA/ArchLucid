using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

public sealed class NoOpPlatformAuditRepository : IPlatformAuditRepository
{
    public Task AppendAsync(PlatformAuditEvent auditEvent, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }
}

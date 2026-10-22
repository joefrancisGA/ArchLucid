namespace ArchLucid.Core.Audit;

/// <summary>Append-only platform audit store (<c>dbo.PlatformAuditEvents</c>).</summary>
public interface IPlatformAuditRepository
{
    Task AppendAsync(PlatformAuditEvent auditEvent, CancellationToken cancellationToken);
}

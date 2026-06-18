using ArchLucid.Core.Transactions;

namespace ArchLucid.Core.Audit;

/// <summary>
///     Enriches and appends audit events (actor, scope, correlation). Implemented in the host (e.g. API).
/// </summary>
public interface IAuditService
{
    Task LogAsync(AuditEvent auditEvent, CancellationToken ct);

    /// <summary>
    ///     Appends on the unit-of-work SQL connection when supported; otherwise falls back to an autonomous append.
    /// </summary>
    Task LogAsync(AuditEvent auditEvent, IArchLucidUnitOfWork unitOfWork, CancellationToken ct);
}

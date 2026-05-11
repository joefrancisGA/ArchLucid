using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

/// <summary>
///     Append-only persistence contract for <see cref="AuditEvent" /> records produced by
///     governance, alert, and run lifecycle actions.
/// </summary>
public interface IAuditRepository
{
    /// <summary>
    ///     Appends a single audit event. Implementations must never update or delete rows;
    ///     this method is insert-only.
    /// </summary>
    /// <param name="auditEvent">The event to append.</param>
    /// <param name="ct">Propagates notification that the operation should be cancelled.</param>
    Task AppendAsync(AuditEvent auditEvent, CancellationToken ct);

    /// <summary>
    ///     Returns up to <paramref name="take" /> audit events for the given scope, ordered by
    ///     event timestamp descending (most recent first).
    /// </summary>
    /// <param name="tenantId">Tenant boundary for the query.</param>
    /// <param name="workspaceId">Workspace boundary for the query.</param>
    /// <param name="projectId">Project boundary for the query.</param>
    /// <param name="take">Maximum number of rows to return (caller should clamp to a safe maximum).</param>
    /// <param name="ct">Propagates notification that the operation should be cancelled.</param>
    Task<IReadOnlyList<AuditEvent>> GetByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct);

    /// <summary>
    ///     Filtered query within scope; <paramref name="filter.Take" /> is clamped 1–500.
    /// </summary>
    Task<IReadOnlyList<AuditEvent>> GetFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct);

    /// <summary>
    ///     Count-only variant of <see cref="GetFilteredAsync" /> using the same scope and filter predicates.
    ///     Ignores <see cref="AuditEventFilter.Take" /> (no listing cap).
    /// </summary>
    Task<int> CountFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct);

    /// <summary>
    ///     Bulk export for compliance reporting: events in <paramref name="tenantId" /> /
    ///     <paramref name="workspaceId" /> / <paramref name="projectId" /> with
    ///     <c>OccurredUtc</c> in the half-open range <c>[fromUtc, toUtc)</c> (i.e.
    ///     <c>&gt;= fromUtc</c> and <c>&lt; toUtc</c>), ordered oldest-first.
    /// </summary>
    /// <param name="maxRows">Maximum rows to return; implementations clamp to 1–10,000.</param>
    Task<IReadOnlyList<AuditEvent>> GetExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime fromUtc,
        DateTime toUtc,
        int maxRows,
        CancellationToken ct);

    /// <summary>
    ///     Filtered bulk export using the same predicates as <see cref="GetFilteredAsync" /> (inclusive
    ///     <see cref="AuditEventFilter.ToUtc" />), ordered oldest-first. Requires
    ///     <see cref="AuditEventFilter.FromUtc" /> and <see cref="AuditEventFilter.ToUtc" />; keyset fields
    ///     (<see cref="AuditEventFilter.BeforeUtc" />) must not be set.
    /// </summary>
    Task<IReadOnlyList<AuditEvent>> GetFilteredExportAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter,
        CancellationToken ct);
}

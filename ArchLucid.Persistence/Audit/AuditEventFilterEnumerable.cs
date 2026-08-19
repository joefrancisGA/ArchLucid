using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

/// <summary>
///     Shared in-memory predicate chain for <see cref="AuditEventFilter" /> — keeps
///     <see cref="InMemoryAuditRepository" /> and shallow test doubles aligned with SQL/Cosmos filtering.
/// </summary>
public static class AuditEventFilterEnumerable
{
    public static IEnumerable<AuditEvent> WhereMatches(
        IEnumerable<AuditEvent> events,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AuditEventFilter filter)
    {
        ArgumentNullException.ThrowIfNull(events);
        ArgumentNullException.ThrowIfNull(filter);

        IEnumerable<AuditEvent> query = events.Where(x =>
            x.TenantId == tenantId
            && x.WorkspaceId == workspaceId
            && x.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(filter.EventType))

            query = query.Where(x => string.Equals(x.EventType, filter.EventType, StringComparison.Ordinal));

        if (filter.FromUtc.HasValue)

            query = query.Where(x => x.OccurredUtc >= filter.FromUtc.Value);

        if (filter.ToUtc.HasValue)

            query = query.Where(x => x.OccurredUtc <= filter.ToUtc.Value);

        if (!string.IsNullOrWhiteSpace(filter.CorrelationId))
            query = query.Where(x =>
                string.Equals(x.CorrelationId, filter.CorrelationId, StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(filter.ActorUserId))
            query = query.Where(x => string.Equals(x.ActorUserId, filter.ActorUserId, StringComparison.Ordinal));

        if (filter.RunId.HasValue)
            query = query.Where(x => x.RunId == filter.RunId.Value);

        if (!filter.BeforeUtc.HasValue)
            return query;

        {
            DateTime beforeUtc = filter.BeforeUtc.Value;

            if (filter.BeforeEventId.HasValue)
            {
                Guid beforeEid = filter.BeforeEventId.Value;
                query = query.Where(x =>
                    x.OccurredUtc < beforeUtc
                    || (x.OccurredUtc == beforeUtc && x.EventId.CompareTo(beforeEid) < 0));
            }
            else
            {
                query = query.Where(x => x.OccurredUtc < beforeUtc);
            }
        }

        return query;
    }
}

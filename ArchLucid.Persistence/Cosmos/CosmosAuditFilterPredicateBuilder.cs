using System.Globalization;
using System.Text;

using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>
///     Appends <see cref="AuditEventFilter" /> predicates onto a Cosmos SQL query already scoped
///     to workspace and project.
/// </summary>
internal static class CosmosAuditFilterPredicateBuilder
{
    internal static void Append(
        StringBuilder sql,
        List<KeyValuePair<string, object?>> parameters,
        AuditEventFilter filter)
    {
        ArgumentNullException.ThrowIfNull(sql);
        ArgumentNullException.ThrowIfNull(parameters);
        ArgumentNullException.ThrowIfNull(filter);

        if (!string.IsNullOrWhiteSpace(filter.EventType))
        {
            sql.Append(" AND c.eventType = @eventType");
            parameters.Add(new KeyValuePair<string, object?>("@eventType", filter.EventType.Trim()));
        }

        if (filter.FromUtc.HasValue)
        {
            sql.Append(" AND c.occurredUtc >= @fromUtc");
            parameters.Add(new KeyValuePair<string, object?>("@fromUtc", FormatUtcIso(filter.FromUtc.Value)));
        }

        if (filter.ToUtc.HasValue)
        {
            sql.Append(" AND c.occurredUtc <= @toUtc");
            parameters.Add(new KeyValuePair<string, object?>("@toUtc", FormatUtcIso(filter.ToUtc.Value)));
        }

        if (!string.IsNullOrWhiteSpace(filter.CorrelationId))
        {
            sql.Append(" AND c.correlationId = @correlationId");
            parameters.Add(new KeyValuePair<string, object?>("@correlationId", filter.CorrelationId.Trim()));
        }

        if (!string.IsNullOrWhiteSpace(filter.ActorUserId))
        {
            sql.Append(" AND c.actorUserId = @actorUserId");
            parameters.Add(new KeyValuePair<string, object?>("@actorUserId", filter.ActorUserId.Trim()));
        }

        if (filter.RunId.HasValue)
        {
            sql.Append(" AND c.runId = @runId");
            parameters.Add(new KeyValuePair<string, object?>("@runId", filter.RunId.Value.ToString("D")));
        }

        if (!filter.BeforeUtc.HasValue)
            return;

        if (filter.BeforeEventId.HasValue)
        {
            sql.Append(
                """
                 AND (
                    c.occurredUtc < @beforeUtc
                    OR (c.occurredUtc = @beforeUtc AND c.id < @beforeEventId)
                )
                """);
            parameters.Add(new KeyValuePair<string, object?>("@beforeUtc", FormatUtcIso(filter.BeforeUtc.Value)));
            parameters.Add(
                new KeyValuePair<string, object?>("@beforeEventId", filter.BeforeEventId.Value.ToString("D")));
        }
        else
        {
            sql.Append(" AND c.occurredUtc < @beforeUtc");
            parameters.Add(new KeyValuePair<string, object?>("@beforeUtc", FormatUtcIso(filter.BeforeUtc.Value)));
        }
    }

    internal static string FormatUtcIso(DateTime value)
    {
        return value.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture);
    }
}

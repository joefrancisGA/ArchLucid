using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text;

using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Audit;

public interface IAuditSqlRetryPolicyProvider
{
    Polly.IAsyncPolicy GetRetryPolicy();
}

/// <summary>
///     SQL Server-backed implementation of <see cref="IAuditRepository" />.
///     Appends <see cref="AuditEvent" /> rows to <c>dbo.AuditEvents</c> and retrieves them
///     scoped to tenant/workspace/project with a configurable paged cap.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class DapperAuditRepository(
    ISqlConnectionFactory writeConnectionFactory,
    IReadOnlyDbConnectionFactory readConnectionFactory,
    IAuditSqlRetryPolicyProvider? retryPolicyProvider = null) : IAuditRepository
{
    private readonly ISqlConnectionFactory _writeConnectionFactory =
        writeConnectionFactory ?? throw new ArgumentNullException(nameof(writeConnectionFactory));

    private readonly IReadOnlyDbConnectionFactory _readConnectionFactory =
        readConnectionFactory ?? throw new ArgumentNullException(nameof(readConnectionFactory));

    private readonly Polly.IAsyncPolicy _retryPolicy = retryPolicyProvider?.GetRetryPolicy() ?? Polly.Policy.NoOpAsync();

    private static void ValidateFilteredExportFilter(AuditEventFilter filter)
    {
        if (filter.BeforeUtc.HasValue || filter.BeforeEventId.HasValue)
        {
            throw new ArgumentException(
                "Filtered export does not support keyset cursor fields.",
                nameof(filter));
        }
    }

    private static void AppendSharedAuditFilterClauses(StringBuilder sql, DynamicParameters parameters, AuditEventFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.EventType))
        {
            sql.Append(" AND EventType = @EventType");
            parameters.Add("EventType", filter.EventType);
        }

        if (filter.FromUtc.HasValue)
        {
            sql.Append(" AND OccurredUtc >= @FromUtc");
            parameters.Add("FromUtc", filter.FromUtc.Value);
        }

        if (filter.ToUtc.HasValue)
        {
            sql.Append(" AND OccurredUtc <= @ToUtc");
            parameters.Add("ToUtc", filter.ToUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.CorrelationId))
        {
            sql.Append(" AND CorrelationId = @CorrelationId");
            parameters.Add("CorrelationId", filter.CorrelationId);
        }

        if (!string.IsNullOrWhiteSpace(filter.ActorUserId))
        {
            sql.Append(" AND ActorUserId = @ActorUserId");
            parameters.Add("ActorUserId", filter.ActorUserId);
        }

        if (filter.RunId.HasValue)
        {
            sql.Append(" AND RunId = @RunId");
            parameters.Add("RunId", filter.RunId.Value);
        }

        if (!filter.BeforeUtc.HasValue)
            return;

        if (filter.BeforeEventId.HasValue)
        {
            sql.Append(
                """
                 AND (
                    OccurredUtc < @BeforeUtc
                    OR (OccurredUtc = @BeforeUtc AND EventId < @BeforeEventId)
                )
                """);
            parameters.Add("BeforeUtc", filter.BeforeUtc.Value);
            parameters.Add("BeforeEventId", filter.BeforeEventId.Value);
        }
        else
        {
            sql.Append(" AND OccurredUtc < @BeforeUtc");
            parameters.Add("BeforeUtc", filter.BeforeUtc.Value);
        }
    }
}

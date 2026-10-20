using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlOperationalSecurityExceptionRepository
{
    public async Task<RemediationFactoryExceptionMetricsAggregate> GetFactoryExceptionMetricsAggregateInScopeAsync(
        ProjectScopeKey scope,
        DateTime utcNow,
        TimeSpan expiringSoonWindow,
        CancellationToken cancellationToken = default)
    {
        DateTime expiringSoonCutoff = utcNow.Add(expiringSoonWindow);

        const string sql = """
                           SELECT
                               SUM(CASE WHEN Status = @ActiveStatus THEN 1 ELSE 0 END) AS ExceptionsActive,
                               SUM(CASE WHEN Status = @ExpiredStatus THEN 1 ELSE 0 END) AS ExceptionsExpired,
                               SUM(CASE WHEN Status = @ActiveStatus
                                   AND ExpirationUtc <= @ExpiringSoonCutoff
                                   AND ExpirationUtc > @UtcNow THEN 1 ELSE 0 END) AS ExceptionsExpiringSoon
                           FROM dbo.OperationalSecurityExceptions
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ExceptionMetricsSummaryRow? summary = await conn.QuerySingleOrDefaultAsync<ExceptionMetricsSummaryRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    UtcNow = utcNow,
                    ExpiringSoonCutoff = expiringSoonCutoff,
                    ActiveStatus = (int)OperationalSecurityExceptionStatus.Active,
                    ExpiredStatus = (int)OperationalSecurityExceptionStatus.Expired,
                },
                cancellationToken: cancellationToken));

        return new RemediationFactoryExceptionMetricsAggregate
        {
            ExceptionsActive = summary?.ExceptionsActive ?? 0,
            ExceptionsExpired = summary?.ExceptionsExpired ?? 0,
            ExceptionsExpiringSoon = summary?.ExceptionsExpiringSoon ?? 0,
        };
    }

    private sealed class ExceptionMetricsSummaryRow
    {
        public int ExceptionsActive
        {
            get;
            init;
        }

        public int ExceptionsExpired
        {
            get;
            init;
        }

        public int ExceptionsExpiringSoon
        {
            get;
            init;
        }
    }
}

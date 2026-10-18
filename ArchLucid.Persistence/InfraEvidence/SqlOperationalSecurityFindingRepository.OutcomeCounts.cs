using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlOperationalSecurityFindingRepository
{
    public async Task<int> CountOpenOrRecurredInScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.OperationalSecurityFindings
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND Status IN (@OpenStatus, @RecurredStatus);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    OpenStatus = (int)OperationalSecurityFindingStatus.Open,
                    RecurredStatus = (int)OperationalSecurityFindingStatus.Recurred,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<int> CountOutcomeRecurrencePairsInScopeAsync(
        ProjectScopeKey scope,
        DateTime windowStartUtc,
        DateTime windowEndUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           WITH scoped AS (
                               SELECT CloudResourceId, ControlId COLLATE Latin1_General_100_BIN2 AS ControlId, Status, UpdatedUtc
                               FROM dbo.OperationalSecurityFindings
                               WHERE TenantId = @TenantId
                                 AND WorkspaceId = @WorkspaceId
                                 AND ProjectId = @ProjectId
                                 AND CloudResourceId IS NOT NULL
                                 AND CloudResourceId <> @EmptyResourceId
                                 AND ControlId IS NOT NULL
                                 AND LTRIM(RTRIM(ControlId)) <> ''
                           ),
                           closed_pairs AS (
                               SELECT DISTINCT CloudResourceId, ControlId
                               FROM scoped
                               WHERE Status = @ClosedStatus
                           ),
                           recurred_pairs AS (
                               SELECT DISTINCT CloudResourceId, ControlId
                               FROM scoped
                               WHERE Status = @RecurredStatus
                                 AND UpdatedUtc > @WindowStartUtc
                                 AND UpdatedUtc <= @WindowEndUtc
                           ),
                           open_after_close AS (
                               SELECT DISTINCT s.CloudResourceId, s.ControlId
                               FROM scoped s
                               INNER JOIN closed_pairs c
                                   ON c.CloudResourceId = s.CloudResourceId
                                   AND c.ControlId = s.ControlId
                               WHERE s.Status = @OpenStatus
                                 AND s.UpdatedUtc > @WindowStartUtc
                                 AND s.UpdatedUtc <= @WindowEndUtc
                           )
                           SELECT COUNT(1)
                           FROM (
                               SELECT CloudResourceId, ControlId FROM recurred_pairs
                               UNION
                               SELECT CloudResourceId, ControlId FROM open_after_close
                           ) pairs;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    EmptyResourceId = Guid.Empty,
                    WindowStartUtc = windowStartUtc,
                    WindowEndUtc = windowEndUtc,
                    OpenStatus = (int)OperationalSecurityFindingStatus.Open,
                    RecurredStatus = (int)OperationalSecurityFindingStatus.Recurred,
                    ClosedStatus = (int)OperationalSecurityFindingStatus.Closed,
                },
                cancellationToken: cancellationToken));
    }
}

using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Dapper implementation of <see cref="IAlertDeliveryAttemptRepository"/> over <c>dbo.AlertDeliveryAttempts</c>.</summary>
/// <param name="connectionFactory">SQL connection factory (scoped in DI).</param>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperAlertDeliveryAttemptRepository(ISqlConnectionFactory connectionFactory)
    : IAlertDeliveryAttemptRepository
{
    /// <inheritdoc />
    public async Task CreateAsync(AlertDeliveryAttempt attempt, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO dbo.AlertDeliveryAttempts
            (
                AlertDeliveryAttemptId, AlertId, RoutingSubscriptionId,
                TenantId, WorkspaceId, ProjectId,
                AttemptedUtc, Status, ErrorMessage,
                ChannelType, Destination, RetryCount
            )
            VALUES
            (
                @AlertDeliveryAttemptId, @AlertId, @RoutingSubscriptionId,
                @TenantId, @WorkspaceId, @ProjectId,
                @AttemptedUtc, @Status, @ErrorMessage,
                @ChannelType, @Destination, @RetryCount
            );
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, attempt, cancellationToken: ct));
    }

    public async Task UpdateAsync(AlertDeliveryAttempt attempt, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.AlertDeliveryAttempts
            SET
                Status = @Status,
                ErrorMessage = @ErrorMessage,
                RetryCount = @RetryCount
            WHERE AlertDeliveryAttemptId = @AlertDeliveryAttemptId
              AND TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, attempt, cancellationToken: ct));
    }

    /// <inheritdoc />
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Alert delivery attempts listed by AlertId within the active tenant catalog.")]
    public async Task<IReadOnlyList<AlertDeliveryAttempt>> ListByAlertAsync(
        ScopeContext scope,
        Guid alertId,
        CancellationToken ct)
    {
        PersistenceTenantScope.RequireScopedTenant(scope);
        const string sql = """
            SELECT TOP 200 *
            FROM dbo.AlertDeliveryAttempts
            WHERE AlertId = @AlertId
              AND TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY AttemptedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<AlertDeliveryAttempt> result = await connection.QueryAsync<AlertDeliveryAttempt>(
            new CommandDefinition(sql, new
            {
                AlertId = alertId,
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId
            }, cancellationToken: ct));
        return result.ToList();
    }

    /// <inheritdoc />
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Alert delivery attempts listed by RoutingSubscriptionId within the active tenant catalog.")]
    public async Task<IReadOnlyList<AlertDeliveryAttempt>> ListBySubscriptionAsync(
        ScopeContext scope,
        Guid routingSubscriptionId,
        int take,
        CancellationToken ct)
    {
        PersistenceTenantScope.RequireScopedTenant(scope);
        const string sql = """
            SELECT TOP (@Take) *
            FROM dbo.AlertDeliveryAttempts
            WHERE RoutingSubscriptionId = @RoutingSubscriptionId
              AND TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY AttemptedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<AlertDeliveryAttempt> result = await connection.QueryAsync<AlertDeliveryAttempt>(
            new CommandDefinition(
                sql,
                new
                {
                    RoutingSubscriptionId = routingSubscriptionId,
                    Take = take,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId
                },
                cancellationToken: ct));
        return result.ToList();
    }
}

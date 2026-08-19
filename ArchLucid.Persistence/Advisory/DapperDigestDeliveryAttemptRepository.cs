using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Advisory;

/// <summary>Dapper implementation of <see cref="IDigestDeliveryAttemptRepository"/> over <c>dbo.DigestDeliveryAttempts</c>.</summary>
/// <param name="connectionFactory">SQL connection factory (scoped in DI).</param>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperDigestDeliveryAttemptRepository(ISqlConnectionFactory connectionFactory)
    : IDigestDeliveryAttemptRepository
{
    /// <summary>Maximum rows returned by <see cref="ListByDigestAsync"/>; kept in sync with <see cref="DigestDeliveryAttemptListCap.Value"/>.</summary>
    private const int ListByDigestCap = DigestDeliveryAttemptListCap.Value;

    /// <inheritdoc />
    public async Task CreateAsync(DigestDeliveryAttempt attempt, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO dbo.DigestDeliveryAttempts
            (
                AttemptId, DigestId, SubscriptionId,
                TenantId, WorkspaceId, ProjectId,
                AttemptedUtc, Status, ErrorMessage,
                ChannelType, Destination
            )
            VALUES
            (
                @AttemptId, @DigestId, @SubscriptionId,
                @TenantId, @WorkspaceId, @ProjectId,
                @AttemptedUtc, @Status, @ErrorMessage,
                @ChannelType, @Destination
            );
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, attempt, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task UpdateAsync(DigestDeliveryAttempt attempt, CancellationToken ct)
    {
        const string sql = """
            UPDATE dbo.DigestDeliveryAttempts
            SET
                Status = @Status,
                ErrorMessage = @ErrorMessage
            WHERE AttemptId = @AttemptId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, attempt, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<DigestDeliveryAttempt>> ListByDigestAsync(
        Guid digestId,
        CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (@Cap)
                AttemptId, DigestId, SubscriptionId,
                TenantId, WorkspaceId, ProjectId,
                AttemptedUtc, Status, ErrorMessage,
                ChannelType, Destination
            FROM dbo.DigestDeliveryAttempts
            WHERE DigestId = @DigestId
            ORDER BY AttemptedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<DigestDeliveryAttempt> result = await connection.QueryAsync<DigestDeliveryAttempt>(
            new CommandDefinition(sql, new
            {
                Cap = ListByDigestCap,
                DigestId = digestId
            }, cancellationToken: ct));

        return result.ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<DigestDeliveryAttempt>> ListByDigestIdsAsync(
        IReadOnlyCollection<Guid> digestIds,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(digestIds);

        if (digestIds.Count == 0)
            return [];

        Guid[] ids = digestIds as Guid[] ?? digestIds.ToArray();

        const string sql = """
            SELECT
                AttemptId, DigestId, SubscriptionId,
                TenantId, WorkspaceId, ProjectId,
                AttemptedUtc, Status, ErrorMessage,
                ChannelType, Destination
            FROM (
                SELECT
                    AttemptId, DigestId, SubscriptionId,
                    TenantId, WorkspaceId, ProjectId,
                    AttemptedUtc, Status, ErrorMessage,
                    ChannelType, Destination,
                    ROW_NUMBER() OVER (PARTITION BY DigestId ORDER BY AttemptedUtc DESC) AS RowNum
                FROM dbo.DigestDeliveryAttempts
                WHERE DigestId IN @DigestIds
                  AND TenantId = @TenantId
                  AND WorkspaceId = @WorkspaceId
                  AND ProjectId = @ProjectId
            ) ranked
            WHERE RowNum <= @Cap
            ORDER BY AttemptedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<DigestDeliveryAttempt> result = await connection.QueryAsync<DigestDeliveryAttempt>(
            new CommandDefinition(sql, new
            {
                Cap = ListByDigestCap,
                DigestIds = ids,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId
            }, cancellationToken: ct));

        return result.ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<DigestDeliveryAttempt>> ListBySubscriptionAsync(
        Guid subscriptionId,
        int take,
        CancellationToken ct)
    {
        take = Math.Clamp(take, 1, 200);
        const string sql = """
            SELECT TOP (@Take)
                AttemptId, DigestId, SubscriptionId,
                TenantId, WorkspaceId, ProjectId,
                AttemptedUtc, Status, ErrorMessage,
                ChannelType, Destination
            FROM dbo.DigestDeliveryAttempts
            WHERE SubscriptionId = @SubscriptionId
            ORDER BY AttemptedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<DigestDeliveryAttempt> result = await connection.QueryAsync<DigestDeliveryAttempt>(
            new CommandDefinition(
                sql,
                new
                {
                    SubscriptionId = subscriptionId,
                    Take = take
                },
                cancellationToken: ct));

        return result.ToList();
    }
}

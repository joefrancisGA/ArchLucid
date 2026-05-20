using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operator;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <inheritdoc cref="IOperatorSavedViewRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via DbUp integration tests.")]
public sealed class DapperOperatorSavedViewRepository(ISqlConnectionFactory connectionFactory)
    : IOperatorSavedViewRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyList<OperatorSavedViewResponse>> ListAsync(
        Guid tenantId,
        string userId,
        string? surface,
        CancellationToken cancellationToken)
    {
        ScopedRepositoryScopeValidation.RequireEntityTenant(tenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        string sql = """
                     SELECT
                         Id,
                         Surface,
                         Name,
                         SortKey,
                         PayloadJson,
                         CreatedUtc,
                         UpdatedUtc
                     FROM dbo.OperatorSavedViews
                     WHERE TenantId = @TenantId
                       AND UserId = @UserId
                     """;

        if (!string.IsNullOrWhiteSpace(surface))
        {
            sql += " AND Surface = @Surface";
        }

        sql += " ORDER BY Name ASC;";

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<OperatorSavedViewRow> rows = await connection.QueryAsync<OperatorSavedViewRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, UserId = userId, Surface = surface },
                cancellationToken: cancellationToken));

        return rows.Select(MapRow).ToList();
    }

    /// <inheritdoc />
    public async Task<OperatorSavedViewResponse?> CreateAsync(
        Guid tenantId,
        string userId,
        string surface,
        string name,
        string payloadJson,
        string? sortKey,
        CancellationToken cancellationToken)
    {
        ScopedRepositoryScopeValidation.RequireEntityTenant(tenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentException.ThrowIfNullOrWhiteSpace(surface);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(payloadJson);

        const string tenantExistsSql = """
                                       SELECT COUNT(1)
                                       FROM dbo.Tenants
                                       WHERE Id = @TenantId;
                                       """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int tenantCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                tenantExistsSql,
                new { TenantId = tenantId },
                cancellationToken: cancellationToken));

        if (tenantCount == 0)
        {
            return null;
        }

        Guid id = Guid.NewGuid();

        const string insertSql = """
                                 INSERT INTO dbo.OperatorSavedViews (
                                     Id,
                                     TenantId,
                                     UserId,
                                     Surface,
                                     Name,
                                     SortKey,
                                     PayloadJson,
                                     CreatedUtc,
                                     UpdatedUtc
                                 )
                                 VALUES (
                                     @Id,
                                     @TenantId,
                                     @UserId,
                                     @Surface,
                                     @Name,
                                     @SortKey,
                                     @PayloadJson,
                                     SYSUTCDATETIME(),
                                     SYSUTCDATETIME()
                                 );
                                 """;

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertSql,
                    new
                    {
                        Id = id,
                        TenantId = tenantId,
                        UserId = userId,
                        Surface = surface,
                        Name = name,
                        SortKey = sortKey,
                        PayloadJson = payloadJson
                    },
                    cancellationToken: cancellationToken));
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            throw new InvalidOperationException(
                $"A saved view named '{name}' already exists for surface '{surface}'.",
                ex);
        }

        OperatorSavedViewRow? row = await connection.QueryFirstOrDefaultAsync<OperatorSavedViewRow>(
            new CommandDefinition(
                """
                SELECT
                    Id,
                    Surface,
                    Name,
                    SortKey,
                    PayloadJson,
                    CreatedUtc,
                    UpdatedUtc
                FROM dbo.OperatorSavedViews
                WHERE Id = @Id;
                """,
                new { Id = id },
                cancellationToken: cancellationToken));

        return row is null ? null : MapRow(row);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(
        Guid tenantId,
        string userId,
        Guid viewId,
        CancellationToken cancellationToken)
    {
        ScopedRepositoryScopeValidation.RequireEntityTenant(tenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        if (viewId == Guid.Empty)
        {
            return false;
        }

        const string sql = """
                           DELETE FROM dbo.OperatorSavedViews
                           WHERE Id = @Id
                             AND TenantId = @TenantId
                             AND UserId = @UserId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { Id = viewId, TenantId = tenantId, UserId = userId },
                cancellationToken: cancellationToken));

        return affected > 0;
    }

    private static OperatorSavedViewResponse MapRow(OperatorSavedViewRow row)
    {
        OperatorSavedViewPayload payload =
            JsonSerializer.Deserialize<OperatorSavedViewPayload>(row.PayloadJson, ContractJson.CamelCaseDeserializeCaseInsensitive)
            ?? new OperatorSavedViewPayload();

        return new OperatorSavedViewResponse
        {
            Id = row.Id,
            Surface = row.Surface,
            Name = row.Name,
            Payload = payload,
            CreatedUtc = new DateTimeOffset(row.CreatedUtc, TimeSpan.Zero),
            UpdatedUtc = new DateTimeOffset(row.UpdatedUtc, TimeSpan.Zero)
        };
    }

    private sealed class OperatorSavedViewRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public string Surface
        {
            get;
            init;
        } = string.Empty;

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public string? SortKey
        {
            get;
            init;
        }

        public string PayloadJson
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }
}

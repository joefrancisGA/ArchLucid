using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlArchitectureShareRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureShareRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<int> CountSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT COUNT(1)
            FROM dbo.ArchitectureShares
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId;
            """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<bool?> TryGetRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT RestrictToShares
            FROM dbo.Architectures
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId;
            """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.ExecuteScalarAsync<bool?>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<bool> TryEnableRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid actorUserId,
        string grantedBy,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(grantedBy);

        DateTime grantedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;
        DateTime updatedUtc = grantedUtc;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await using SqlTransaction transaction =
            (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);

        const string existsSql = """
            SELECT 1
            FROM dbo.Architectures
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId;
            """;

        int? exists = await connection.ExecuteScalarAsync<int?>(
            new CommandDefinition(
                existsSql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                },
                transaction,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        if (exists is not 1)
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);

            return false;
        }

        const string countSql = """
            SELECT COUNT(1)
            FROM dbo.ArchitectureShares
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId;
            """;

        int shareCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                countSql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                },
                transaction,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        if (shareCount == 0)
        {
            const string insertShareSql = """
                INSERT INTO dbo.ArchitectureShares
                (
                    ArchitectureId,
                    UserId,
                    TenantId,
                    WorkspaceId,
                    ScopeProjectId,
                    Role,
                    GrantedBy,
                    GrantedUtc
                )
                VALUES
                (
                    @ArchitectureId,
                    @UserId,
                    @TenantId,
                    @WorkspaceId,
                    @ScopeProjectId,
                    @Role,
                    @GrantedBy,
                    @GrantedUtc
                );
                """;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertShareSql,
                    new
                    {
                        ArchitectureId = architectureId,
                        UserId = actorUserId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                        Role = ArchitectureShareRoles.Admin,
                        GrantedBy = grantedBy,
                        GrantedUtc = grantedUtc,
                    },
                    transaction,
                    cancellationToken: cancellationToken)).ConfigureAwait(false);
        }

        const string updateSql = """
            UPDATE dbo.Architectures
            SET RestrictToShares = 1,
                UpdatedUtc = @UpdatedUtc
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId;
            """;

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                updateSql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                    UpdatedUtc = updatedUtc,
                },
                transaction,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        if (rows != 1)
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);

            return false;
        }

        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);

        return true;
    }

    public async Task<bool> TryDisableRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            UPDATE dbo.Architectures
            SET RestrictToShares = 0,
                UpdatedUtc = @UpdatedUtc
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId;
            """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                    UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows == 1;
    }

    public async Task<string?> TryGetShareRoleAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT Role
            FROM dbo.ArchitectureShares
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId
              AND UserId = @UserId;
            """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.ExecuteScalarAsync<string?>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                    UserId = userId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }
}

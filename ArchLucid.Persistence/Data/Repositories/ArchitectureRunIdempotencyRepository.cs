using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper implementation for <see cref="IArchitectureRunIdempotencyRepository" /> (SQL Server).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class ArchitectureRunIdempotencyRepository(IDbConnectionFactory connectionFactory)
    : IArchitectureRunIdempotencyRepository
{
    /// <inheritdoc />
    public async Task<ArchitectureRunIdempotencyLookup?> TryGetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        byte[] idempotencyKeyHash,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(idempotencyKeyHash);

        const string sql = """
                           SELECT RunId, RequestFingerprint
                           FROM ArchitectureRunIdempotency
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND IdempotencyKeyHash = @IdempotencyKeyHash;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ArchitectureRunIdempotencyRow? row = await connection
                .QueryFirstOrDefaultAsync<ArchitectureRunIdempotencyRow>(
                    new CommandDefinition(
                        sql,
                        new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, IdempotencyKeyHash = idempotencyKeyHash },
                        cancellationToken: cancellationToken))
            ;

        return row is null
            ? null
            : new ArchitectureRunIdempotencyLookup
            {
                RunId = row.RunId.ToString("N"),
                RequestFingerprint = row.RequestFingerprint ?? []
            };
    }

    /// <inheritdoc />
    public async Task<bool> TryInsertAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        byte[] idempotencyKeyHash,
        byte[] requestFingerprint,
        string runId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(idempotencyKeyHash);
        ArgumentNullException.ThrowIfNull(requestFingerprint);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        const string sql = """
                           INSERT INTO ArchitectureRunIdempotency
                           (
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               IdempotencyKeyHash,
                               RequestFingerprint,
                               RunId,
                               CreatedUtc
                           )
                           VALUES
                           (
                               @TenantId,
                               @WorkspaceId,
                               @ProjectId,
                               @IdempotencyKeyHash,
                               @RequestFingerprint,
                               @RunId,
                               @CreatedUtc
                           );
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

        try
        {
            int affected = await conn
                    .ExecuteAsync(new CommandDefinition(
                        sql,
                        new
                        {
                            TenantId = tenantId,
                            WorkspaceId = workspaceId,
                            ProjectId = projectId,
                            IdempotencyKeyHash = idempotencyKeyHash,
                            RequestFingerprint = requestFingerprint,
                            RunId = SqlRunIdMapping.ToSqlRunId(runId),
                            CreatedUtc = createdUtc
                        },
                        transaction,
                        cancellationToken: cancellationToken))
                ;

            return affected > 0;
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            return false;
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    /// <inheritdoc />
    public async Task<ArchitectureRunIdempotencyLookup?> TryGetRecentByFingerprintAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        byte[] requestFingerprint,
        DateTime createdAfterUtc,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(requestFingerprint);

        const string sql = """
                           SELECT TOP (1) RunId, RequestFingerprint
                           FROM ArchitectureRunIdempotency
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND RequestFingerprint = @RequestFingerprint
                             AND CreatedUtc >= @CreatedAfterUtc
                           ORDER BY CreatedUtc DESC;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ArchitectureRunIdempotencyRow? row = await connection
            .QueryFirstOrDefaultAsync<ArchitectureRunIdempotencyRow>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        WorkspaceId = workspaceId,
                        ProjectId = projectId,
                        RequestFingerprint = requestFingerprint,
                        CreatedAfterUtc = createdAfterUtc,
                    },
                    cancellationToken: cancellationToken));

        return row is null
            ? null
            : new ArchitectureRunIdempotencyLookup
            {
                RunId = row.RunId.ToString("N"),
                RequestFingerprint = row.RequestFingerprint ?? [],
            };
    }

    private sealed class ArchitectureRunIdempotencyRow
    {
        public Guid RunId
        {
            get;
            init;
        }

        public byte[]? RequestFingerprint
        {
            get;
            init;
        }
    }
}

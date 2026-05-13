using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <inheritdoc cref="ICommitRunIdempotencyRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class CommitRunIdempotencyRepository(IDbConnectionFactory connectionFactory)
    : ICommitRunIdempotencyRepository
{
    /// <inheritdoc />
    public async Task<CommitRunIdempotencyLookup?> TryGetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string runId,
        byte[] idempotencyKeyHash,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(idempotencyKeyHash);

        const string sql = """
                           SELECT RequestFingerprint
                           FROM dbo.CommitRunIdempotency
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND RunId = @RunId
                             AND IdempotencyKeyHash = @IdempotencyKeyHash;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        byte[]? fingerprint = await connection
            .QuerySingleOrDefaultAsync<byte[]?>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, RunId = runId, IdempotencyKeyHash = idempotencyKeyHash },
                    cancellationToken: cancellationToken));

        return fingerprint is null ? null : new CommitRunIdempotencyLookup { RequestFingerprint = fingerprint };
    }

    /// <inheritdoc />
    public async Task<bool> TryInsertAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string runId,
        byte[] idempotencyKeyHash,
        byte[] requestFingerprint,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(idempotencyKeyHash);
        ArgumentNullException.ThrowIfNull(requestFingerprint);

        const string sql = """
                           INSERT INTO dbo.CommitRunIdempotency
                           (
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               RunId,
                               IdempotencyKeyHash,
                               RequestFingerprint,
                               CreatedUtc
                           )
                           VALUES
                           (
                               @TenantId,
                               @WorkspaceId,
                               @ProjectId,
                               @RunId,
                               @IdempotencyKeyHash,
                               @RequestFingerprint,
                               @CreatedUtc
                           );
                           """;

        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        try
        {
            int affected =
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        sql,
                        new
                        {
                            TenantId = tenantId,
                            WorkspaceId = workspaceId,
                            ProjectId = projectId,
                            RunId = runId,
                            IdempotencyKeyHash = idempotencyKeyHash,
                            RequestFingerprint = requestFingerprint,
                            CreatedUtc = createdUtc
                        },
                        cancellationToken: cancellationToken));

            return affected > 0;
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            return false;
        }
    }
}

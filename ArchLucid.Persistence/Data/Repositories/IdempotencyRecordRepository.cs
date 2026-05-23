using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class IdempotencyRecordRepository(IDbConnectionFactory connectionFactory) : IIdempotencyRecordRepository
{
    public async Task<IdempotencyRecordRow?> TryGetAsync(
        Guid tenantId,
        string idempotencyKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);

        const string sql = """
                           SELECT IdempotencyKey, TenantId, StatusCode, ResponseBody, CreatedUtc
                           FROM dbo.IdempotencyRecords
                           WHERE TenantId = @TenantId
                             AND IdempotencyKey = @IdempotencyKey;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<IdempotencyRecordRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, IdempotencyKey = idempotencyKey },
                cancellationToken: cancellationToken));
    }

    public async Task<bool> TryInsertAsync(
        Guid tenantId,
        string idempotencyKey,
        int statusCode,
        string responseBody,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);

        const string sql = """
                           INSERT INTO dbo.IdempotencyRecords (IdempotencyKey, TenantId, StatusCode, ResponseBody, CreatedUtc)
                           SELECT @IdempotencyKey, @TenantId, @StatusCode, @ResponseBody, SYSUTCDATETIME()
                           WHERE NOT EXISTS (
                               SELECT 1 FROM dbo.IdempotencyRecords
                               WHERE TenantId = @TenantId AND IdempotencyKey = @IdempotencyKey
                           );
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    IdempotencyKey = idempotencyKey,
                    StatusCode = statusCode,
                    ResponseBody = responseBody
                },
                cancellationToken: cancellationToken));

        return rows > 0;
    }
}

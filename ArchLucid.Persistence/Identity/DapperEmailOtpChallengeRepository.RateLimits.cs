using ArchLucid.Core.Identity;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

public sealed partial class DapperEmailOtpChallengeRepository
{
    public async Task<int> CountRecentRequestsByEmailAsync(
        string normalizedEmail,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.EmailOtpChallenges
                           WHERE NormalizedEmail = @NormalizedEmail
                             AND CreatedUtc >= @SinceUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new { NormalizedEmail = normalizedEmail, SinceUtc = sinceUtc.UtcDateTime },
                cancellationToken: cancellationToken));
    }

    public async Task<int> CountRecentRequestsByClientIpHashAsync(
        string clientIpHash,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.EmailOtpChallenges
                           WHERE ClientIpHash = @ClientIpHash
                             AND CreatedUtc >= @SinceUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new { ClientIpHash = clientIpHash, SinceUtc = sinceUtc.UtcDateTime },
                cancellationToken: cancellationToken));
    }

    public async Task<EmailOtpRecentRequestCounts> CountRecentRequestsForRateLimitAsync(
        string normalizedEmail,
        string? clientIpHash,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        const string batchSql = """
                                SELECT COUNT(1)
                                FROM dbo.EmailOtpChallenges
                                WHERE NormalizedEmail = @NormalizedEmail
                                  AND CreatedUtc >= @SinceUtc;

                                SELECT COUNT(1)
                                FROM dbo.EmailOtpChallenges
                                WHERE ClientIpHash = @ClientIpHash
                                  AND CreatedUtc >= @SinceUtc
                                  AND @ClientIpHash IS NOT NULL;
                                """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                batchSql,
                new
                {
                    NormalizedEmail = normalizedEmail,
                    ClientIpHash = clientIpHash,
                    SinceUtc = sinceUtc.UtcDateTime,
                },
                cancellationToken: cancellationToken));

        int emailCount = await multi.ReadSingleAsync<int>();
        int ipCount = await multi.ReadSingleAsync<int>();

        return new EmailOtpRecentRequestCounts(emailCount, ipCount);
    }

    public async Task<int> CountRecentFailedVerificationsByEmailAsync(
        string normalizedEmail,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.EmailOtpChallenges
                           WHERE NormalizedEmail = @NormalizedEmail
                             AND CreatedUtc >= @SinceUtc
                             AND FailedAttemptCount > 0
                             AND CompletedUtc IS NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new { NormalizedEmail = normalizedEmail, SinceUtc = sinceUtc.UtcDateTime },
                cancellationToken: cancellationToken));
    }

    public async Task<DateTimeOffset?> GetLatestRequestUtcByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TOP (1) CreatedUtc
                           FROM dbo.EmailOtpChallenges
                           WHERE NormalizedEmail = @NormalizedEmail
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DateTime? createdUtc = await connection.ExecuteScalarAsync<DateTime?>(
            new CommandDefinition(sql, new { NormalizedEmail = normalizedEmail }, cancellationToken: cancellationToken));

        return createdUtc is null
            ? null
            : new DateTimeOffset(DateTime.SpecifyKind(createdUtc.Value, DateTimeKind.Utc));
    }
}

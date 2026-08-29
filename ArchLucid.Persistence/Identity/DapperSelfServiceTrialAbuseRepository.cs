using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperSelfServiceTrialAbuseRepository(ISqlConnectionFactory connectionFactory) : ISelfServiceTrialAbuseRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<bool> HasEmailClaimAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int count = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                """
                SELECT COUNT(1)
                FROM dbo.PlatformSelfServiceTrialEmailClaims
                WHERE NormalizedEmail = @NormalizedEmail;
                """,
                new { NormalizedEmail = normalizedEmail },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return count > 0;
    }

    public async Task TryInsertEmailClaimAsync(SelfServiceTrialEmailClaimInsert claim, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                IF NOT EXISTS (
                    SELECT 1
                    FROM dbo.PlatformSelfServiceTrialEmailClaims
                    WHERE NormalizedEmail = @NormalizedEmail)
                BEGIN
                    INSERT INTO dbo.PlatformSelfServiceTrialEmailClaims
                        (NormalizedEmail, PlatformUserId, TenantId, ClaimSource, ClaimedUtc)
                    VALUES
                        (@NormalizedEmail, @PlatformUserId, @TenantId, @ClaimSource, @ClaimedUtc);
                END
                """,
                new
                {
                    claim.NormalizedEmail,
                    claim.PlatformUserId,
                    claim.TenantId,
                    claim.ClaimSource,
                    ClaimedUtc = claim.ClaimedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<int> CountDomainClaimsSinceAsync(
        string normalizedDomain,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                """
                SELECT COUNT(1)
                FROM dbo.PlatformSelfServiceTrialDomainClaims
                WHERE NormalizedDomain = @NormalizedDomain
                  AND ClaimedUtc >= @SinceUtc;
                """,
                new { NormalizedDomain = normalizedDomain, SinceUtc = sinceUtc.UtcDateTime },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task InsertDomainClaimAsync(string normalizedDomain, DateTimeOffset claimedUtc, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO dbo.PlatformSelfServiceTrialDomainClaims
                    (NormalizedDomain, ClaimedUtc)
                VALUES
                    (@NormalizedDomain, @ClaimedUtc);
                """,
                new { NormalizedDomain = normalizedDomain, ClaimedUtc = claimedUtc.UtcDateTime },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }
}

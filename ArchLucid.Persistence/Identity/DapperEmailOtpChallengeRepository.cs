using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed partial class DapperEmailOtpChallengeRepository(ISqlConnectionFactory connectionFactory) : IEmailOtpChallengeRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<EmailOtpChallengeRecord> InsertAsync(
        EmailOtpChallengeInsert insert,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.EmailOtpChallenges
                               (Id, NormalizedEmail, CodeHash, ExpiresUtc, ClientIpHash, UserAgentHash, InvitationId)
                           OUTPUT INSERTED.Id, INSERTED.NormalizedEmail, INSERTED.CodeHash, INSERTED.CreatedUtc,
                                  INSERTED.ExpiresUtc, INSERTED.FailedAttemptCount, INSERTED.CompletedUtc,
                                  INSERTED.InvalidatedUtc, INSERTED.ClientIpHash, INSERTED.UserAgentHash,
                                  INSERTED.InvitationId, INSERTED.RowVersion
                           VALUES
                               (@Id, @NormalizedEmail, @CodeHash, @ExpiresUtc, @ClientIpHash, @UserAgentHash, @InvitationId);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ChallengeRow row = await connection.QuerySingleAsync<ChallengeRow>(
            new CommandDefinition(
                sql,
                new
                {
                    insert.Id,
                    insert.NormalizedEmail,
                    insert.CodeHash,
                    ExpiresUtc = insert.ExpiresUtc.UtcDateTime,
                    insert.ClientIpHash,
                    insert.UserAgentHash,
                    insert.InvitationId
                },
                cancellationToken: cancellationToken));

        return row.ToRecord();
    }

    public async Task<EmailOtpChallengeRecord?> GetByIdAsync(Guid challengeId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, NormalizedEmail, CodeHash, CreatedUtc, ExpiresUtc, FailedAttemptCount,
                                  CompletedUtc, InvalidatedUtc, ClientIpHash, UserAgentHash, InvitationId, RowVersion
                           FROM dbo.EmailOtpChallenges
                           WHERE Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ChallengeRow? row = await connection.QuerySingleOrDefaultAsync<ChallengeRow>(
            new CommandDefinition(sql, new { Id = challengeId }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task InvalidateActiveChallengesForEmailAsync(
        string normalizedEmail,
        DateTimeOffset invalidatedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.EmailOtpChallenges
                           SET InvalidatedUtc = @InvalidatedUtc
                           WHERE NormalizedEmail = @NormalizedEmail
                             AND CompletedUtc IS NULL
                             AND InvalidatedUtc IS NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { NormalizedEmail = normalizedEmail, InvalidatedUtc = invalidatedUtc.UtcDateTime },
                cancellationToken: cancellationToken));
    }
}

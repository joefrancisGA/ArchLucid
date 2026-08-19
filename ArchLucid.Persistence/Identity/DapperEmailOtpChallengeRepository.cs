using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperEmailOtpChallengeRepository(ISqlConnectionFactory connectionFactory) : IEmailOtpChallengeRepository
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

    public async Task<EmailOtpChallengeCompletionOutcome> TryCompleteAsync(
        Guid challengeId,
        string codeHash,
        DateTimeOffset nowUtc,
        int maxFailedAttempts,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await using SqlTransaction transaction =
            (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);

        const string selectSql = """
                                 SELECT Id, NormalizedEmail, CodeHash, CreatedUtc, ExpiresUtc, FailedAttemptCount,
                                        CompletedUtc, InvalidatedUtc, ClientIpHash, UserAgentHash, InvitationId, RowVersion
                                 FROM dbo.EmailOtpChallenges WITH (UPDLOCK, ROWLOCK)
                                 WHERE Id = @Id;
                                 """;

        ChallengeRow? existing = await connection.QuerySingleOrDefaultAsync<ChallengeRow>(
            new CommandDefinition(
                selectSql,
                new { Id = challengeId },
                transaction: transaction,
                cancellationToken: cancellationToken));

        if (existing is null)
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);

            return new EmailOtpChallengeCompletionOutcome { Result = EmailOtpChallengeCompletionResult.NotFound };
        }

        EmailOtpChallengeRecord record = existing.ToRecord();

        if (record.CompletedUtc is not null)
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);

            return new EmailOtpChallengeCompletionOutcome
            {
                Result = EmailOtpChallengeCompletionResult.AlreadyCompleted
            };
        }

        if (record.InvalidatedUtc is not null)
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);

            return new EmailOtpChallengeCompletionOutcome { Result = EmailOtpChallengeCompletionResult.Invalidated };
        }

        if (record.ExpiresUtc <= nowUtc)
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);

            return new EmailOtpChallengeCompletionOutcome { Result = EmailOtpChallengeCompletionResult.Expired };
        }

        if (!FixedTimeHexEquals.Equals(record.CodeHash, codeHash))
        {
            int failed = record.FailedAttemptCount + 1;
            DateTime? invalidatedUtc = failed >= maxFailedAttempts ? nowUtc.UtcDateTime : null;

            const string failSql = """
                                   UPDATE dbo.EmailOtpChallenges
                                   SET FailedAttemptCount = @FailedAttemptCount,
                                       InvalidatedUtc = @InvalidatedUtc
                                   WHERE Id = @Id
                                     AND RowVersion = @RowVersion;
                                   """;

            int affected = await connection.ExecuteAsync(
                new CommandDefinition(
                    failSql,
                    new
                    {
                        Id = challengeId,
                        FailedAttemptCount = failed,
                        InvalidatedUtc = invalidatedUtc,
                        RowVersion = existing.RowVersion
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken));

            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);

            if (affected == 0)
            {
                return new EmailOtpChallengeCompletionOutcome { Result = EmailOtpChallengeCompletionResult.InvalidCode };
            }

            return new EmailOtpChallengeCompletionOutcome
            {
                Result = failed >= maxFailedAttempts
                    ? EmailOtpChallengeCompletionResult.TooManyAttempts
                    : EmailOtpChallengeCompletionResult.InvalidCode
            };
        }

        const string completeSql = """
                                 UPDATE dbo.EmailOtpChallenges
                                 SET CompletedUtc = @CompletedUtc
                                 OUTPUT INSERTED.Id, INSERTED.NormalizedEmail, INSERTED.CodeHash, INSERTED.CreatedUtc,
                                        INSERTED.ExpiresUtc, INSERTED.FailedAttemptCount, INSERTED.CompletedUtc,
                                        INSERTED.InvalidatedUtc, INSERTED.ClientIpHash, INSERTED.UserAgentHash,
                                        INSERTED.InvitationId, INSERTED.RowVersion
                                 WHERE Id = @Id
                                   AND CompletedUtc IS NULL
                                   AND InvalidatedUtc IS NULL
                                   AND ExpiresUtc > @CompletedUtc
                                   AND CodeHash = @CodeHash
                                   AND RowVersion = @RowVersion;
                                 """;

        ChallengeRow? completed = await connection.QuerySingleOrDefaultAsync<ChallengeRow>(
            new CommandDefinition(
                completeSql,
                new
                {
                    Id = challengeId,
                    CodeHash = codeHash,
                    CompletedUtc = nowUtc.UtcDateTime,
                    RowVersion = existing.RowVersion
                },
                transaction: transaction,
                cancellationToken: cancellationToken));

        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);

        if (completed is null)
        {
            return new EmailOtpChallengeCompletionOutcome
            {
                Result = EmailOtpChallengeCompletionResult.AlreadyCompleted
            };
        }

        return new EmailOtpChallengeCompletionOutcome
        {
            Result = EmailOtpChallengeCompletionResult.Completed,
            Challenge = completed.ToRecord()
        };
    }

    private sealed class ChallengeRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public string NormalizedEmail
        {
            get;
            init;
        } = string.Empty;

        public string CodeHash
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime ExpiresUtc
        {
            get;
            init;
        }

        public int FailedAttemptCount
        {
            get;
            init;
        }

        public DateTime? CompletedUtc
        {
            get;
            init;
        }

        public DateTime? InvalidatedUtc
        {
            get;
            init;
        }

        public string? ClientIpHash
        {
            get;
            init;
        }

        public string? UserAgentHash
        {
            get;
            init;
        }

        public Guid? InvitationId
        {
            get;
            init;
        }

        public byte[] RowVersion
        {
            get;
            init;
        } = [];

        public EmailOtpChallengeRecord ToRecord() =>
            new()
            {
                Id = Id,
                NormalizedEmail = NormalizedEmail,
                CodeHash = CodeHash,
                CreatedUtc = new DateTimeOffset(DateTime.SpecifyKind(CreatedUtc, DateTimeKind.Utc)),
                ExpiresUtc = new DateTimeOffset(DateTime.SpecifyKind(ExpiresUtc, DateTimeKind.Utc)),
                FailedAttemptCount = FailedAttemptCount,
                CompletedUtc = CompletedUtc is null
                    ? null
                    : new DateTimeOffset(DateTime.SpecifyKind(CompletedUtc.Value, DateTimeKind.Utc)),
                InvalidatedUtc = InvalidatedUtc is null
                    ? null
                    : new DateTimeOffset(DateTime.SpecifyKind(InvalidatedUtc.Value, DateTimeKind.Utc)),
                ClientIpHash = ClientIpHash,
                UserAgentHash = UserAgentHash,
                InvitationId = InvitationId,
                RowVersion = RowVersion
            };
    }
}

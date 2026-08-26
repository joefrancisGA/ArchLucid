using ArchLucid.Core.Identity;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

public sealed partial class DapperEmailOtpChallengeRepository
{
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

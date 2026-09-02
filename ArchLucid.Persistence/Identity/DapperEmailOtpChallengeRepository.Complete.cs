using ArchLucid.Core.Identity;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

public sealed partial class DapperEmailOtpChallengeRepository
{
    private const int MaxCompleteConcurrencyRetries = 8;

    public async Task<EmailOtpChallengeCompletionOutcome> TryCompleteAsync(
        Guid challengeId,
        string codeHash,
        DateTimeOffset nowUtc,
        int maxFailedAttempts,
        CancellationToken cancellationToken)
    {
        for (int attempt = 0; attempt < MaxCompleteConcurrencyRetries; attempt++)
        {
            EmailOtpChallengeCompletionOutcome? retryableOutcome =
                await TryCompleteSingleAttemptAsync(
                    challengeId,
                    codeHash,
                    nowUtc,
                    maxFailedAttempts,
                    cancellationToken);

            if (retryableOutcome is null)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);
                continue;
            }

            return retryableOutcome;
        }

        return new EmailOtpChallengeCompletionOutcome
        {
            Result = EmailOtpChallengeCompletionResult.InvalidCode
        };
    }

    private async Task<EmailOtpChallengeCompletionOutcome?> TryCompleteSingleAttemptAsync(
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

        (EmailOtpChallengeCompletionOutcome outcome, EmailOtpChallengeRecord? updated) =
            EmailOtpChallengeRepositoryCore.EvaluateCompletion(record, codeHash, nowUtc, maxFailedAttempts);

        if (outcome.Result is EmailOtpChallengeCompletionResult.NotFound
            or EmailOtpChallengeCompletionResult.AlreadyCompleted
            or EmailOtpChallengeCompletionResult.Invalidated
            or EmailOtpChallengeCompletionResult.Expired)
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);

            return outcome;
        }

        if (outcome.Result is EmailOtpChallengeCompletionResult.InvalidCode
            or EmailOtpChallengeCompletionResult.TooManyAttempts)
        {
            ArgumentNullException.ThrowIfNull(updated);

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
                        FailedAttemptCount = updated.FailedAttemptCount,
                        InvalidatedUtc = updated.InvalidatedUtc?.UtcDateTime,
                        RowVersion = existing.RowVersion
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken));

            if (affected == 0)
            {
                await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);

                return null;
            }

            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);

            return outcome;
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
            EmailOtpChallengeRepositoryCore.MapFromStorage(
                Id,
                NormalizedEmail,
                CodeHash,
                CreatedUtc,
                ExpiresUtc,
                FailedAttemptCount,
                CompletedUtc,
                InvalidatedUtc,
                ClientIpHash,
                UserAgentHash,
                InvitationId,
                RowVersion);
    }
}

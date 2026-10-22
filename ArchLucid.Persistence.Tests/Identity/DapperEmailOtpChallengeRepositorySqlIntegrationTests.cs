using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

/// <summary>
///     <see cref="DapperEmailOtpChallengeRepository" /> against SQL (<c>dbo.EmailOtpChallenges</c>).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class DapperEmailOtpChallengeRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task TryCompleteAsync_parallel_wrong_codes_increment_failed_attempt_count()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperEmailOtpChallengeRepository sut = new(factory);
        Guid challengeId = Guid.NewGuid();
        string rawCode = "123456";
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, rawCode, string.Empty);
        string wrongCodeHash = EmailOtpCodeHasher.Hash(challengeId, "000000", string.Empty);
        DateTimeOffset now = DateTimeOffset.UtcNow;
        const int parallelAttempts = 5;

        await sut.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = "otp-concurrency+" + Guid.NewGuid().ToString("N")[..8] + "@example.com",
                CodeHash = codeHash,
                ExpiresUtc = now.AddMinutes(10)
            },
            CancellationToken.None);

        Task<EmailOtpChallengeCompletionOutcome>[] attempts =
            Enumerable.Range(0, parallelAttempts)
                .Select(_ => sut.TryCompleteAsync(challengeId, wrongCodeHash, now, 10, CancellationToken.None))
                .ToArray();

        EmailOtpChallengeCompletionOutcome[] outcomes = await Task.WhenAll(attempts);

        foreach (EmailOtpChallengeCompletionOutcome outcome in outcomes)
        {
            outcome.Result.Should().BeOneOf(
                EmailOtpChallengeCompletionResult.InvalidCode,
                EmailOtpChallengeCompletionResult.TooManyAttempts);
        }

        EmailOtpChallengeRecord? final = await sut.GetByIdAsync(challengeId, CancellationToken.None);

        final.Should().NotBeNull();
        final!.FailedAttemptCount.Should().Be(parallelAttempts);
    }
}

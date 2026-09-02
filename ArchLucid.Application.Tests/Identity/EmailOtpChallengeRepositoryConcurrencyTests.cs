using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class EmailOtpChallengeRepositoryConcurrencyTests
{
    [Fact]
    public async Task TryCompleteAsync_allows_only_one_successful_completion()
    {
        InMemoryEmailOtpChallengeRepository repository = new();
        Guid challengeId = Guid.NewGuid();
        string rawCode = "123456";
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, rawCode, string.Empty);
        DateTimeOffset now = DateTimeOffset.UtcNow;

        await repository.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = "concurrent@example.com",
                CodeHash = codeHash,
                ExpiresUtc = now.AddMinutes(10)
            },
            CancellationToken.None);

        Task<EmailOtpChallengeCompletionOutcome>[] attempts =
        [
            repository.TryCompleteAsync(challengeId, codeHash, now, 5, CancellationToken.None),
            repository.TryCompleteAsync(challengeId, codeHash, now, 5, CancellationToken.None)
        ];

        EmailOtpChallengeCompletionOutcome[] outcomes = await Task.WhenAll(attempts);

        int successCount = outcomes.Count(outcome => outcome.Result == EmailOtpChallengeCompletionResult.Completed);

        Assert.Equal(1, successCount);
    }

    [Fact]
    public async Task TryCompleteAsync_parallel_wrong_codes_increment_failed_attempt_count()
    {
        InMemoryEmailOtpChallengeRepository repository = new();
        Guid challengeId = Guid.NewGuid();
        string rawCode = "123456";
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, rawCode, string.Empty);
        string wrongCodeHash = EmailOtpCodeHasher.Hash(challengeId, "000000", string.Empty);
        DateTimeOffset now = DateTimeOffset.UtcNow;
        const int parallelAttempts = 5;

        await repository.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = "concurrent-wrong@example.com",
                CodeHash = codeHash,
                ExpiresUtc = now.AddMinutes(10)
            },
            CancellationToken.None);

        Task<EmailOtpChallengeCompletionOutcome>[] attempts =
            Enumerable.Range(0, parallelAttempts)
                .Select(_ => repository.TryCompleteAsync(challengeId, wrongCodeHash, now, 10, CancellationToken.None))
                .ToArray();

        EmailOtpChallengeCompletionOutcome[] outcomes = await Task.WhenAll(attempts);

        Assert.All(
            outcomes,
            outcome => Assert.True(
                outcome.Result is EmailOtpChallengeCompletionResult.InvalidCode
                    or EmailOtpChallengeCompletionResult.TooManyAttempts));

        EmailOtpChallengeRecord? final = await repository.GetByIdAsync(challengeId, CancellationToken.None);

        Assert.NotNull(final);
        Assert.Equal(parallelAttempts, final!.FailedAttemptCount);
    }

    [Fact]
    public async Task ReplaceActiveChallengeForEmailAsync_parallel_calls_leave_single_active_challenge()
    {
        InMemoryEmailOtpChallengeRepository repository = new();
        string normalizedEmail = "replace-active@example.com";
        DateTimeOffset now = DateTimeOffset.UtcNow;

        await repository.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = Guid.NewGuid(),
                NormalizedEmail = normalizedEmail,
                CodeHash = "seed-hash",
                ExpiresUtc = now.AddMinutes(10)
            },
            CancellationToken.None);

        Task<EmailOtpChallengeRecord>[] replacements =
        [
            repository.ReplaceActiveChallengeForEmailAsync(
                new EmailOtpChallengeInsert
                {
                    Id = Guid.NewGuid(),
                    NormalizedEmail = normalizedEmail,
                    CodeHash = "hash-a",
                    ExpiresUtc = now.AddMinutes(10)
                },
                now,
                CancellationToken.None),
            repository.ReplaceActiveChallengeForEmailAsync(
                new EmailOtpChallengeInsert
                {
                    Id = Guid.NewGuid(),
                    NormalizedEmail = normalizedEmail,
                    CodeHash = "hash-b",
                    ExpiresUtc = now.AddMinutes(10)
                },
                now,
                CancellationToken.None)
        ];

        EmailOtpChallengeRecord[] created = await Task.WhenAll(replacements);

        int activeCount = 0;

        foreach (EmailOtpChallengeRecord row in created)
        {
            EmailOtpChallengeRecord? current = await repository.GetByIdAsync(row.Id, CancellationToken.None);

            if (current is { CompletedUtc: null, InvalidatedUtc: null })
            {
                activeCount++;
            }
        }

        Assert.Equal(1, activeCount);
    }
}

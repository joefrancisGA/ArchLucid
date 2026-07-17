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
}

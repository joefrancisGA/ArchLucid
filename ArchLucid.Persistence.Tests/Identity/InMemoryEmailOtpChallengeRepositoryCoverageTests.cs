using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryEmailOtpChallengeRepositoryCoverageTests
{
    [Fact]
    public async Task Insert_counts_latest_and_invalidate_cover_request_paths()
    {
        InMemoryEmailOtpChallengeRepository sut = new();
        DateTimeOffset expires = TimeProvider.System.GetUtcNow().AddMinutes(10);
        Guid knownId = Guid.NewGuid();

        EmailOtpChallengeRecord first = await sut.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = knownId,
                NormalizedEmail = "user@example.com",
                CodeHash = "hash-a",
                ExpiresUtc = expires,
                ClientIpHash = "ip-1",
                UserAgentHash = "ua-1",
            },
            CancellationToken.None);

        EmailOtpChallengeRecord second = await sut.InsertAsync(
            new EmailOtpChallengeInsert
            {
                NormalizedEmail = "user@example.com",
                CodeHash = "hash-b",
                ExpiresUtc = expires,
                ClientIpHash = "ip-1",
            },
            CancellationToken.None);

        first.Id.Should().Be(knownId);
        second.Id.Should().NotBe(Guid.Empty);
        (await sut.GetByIdAsync(knownId, CancellationToken.None))!.CodeHash.Should().Be("hash-a");

        DateTimeOffset since = TimeProvider.System.GetUtcNow().AddMinutes(-1);
        (await sut.CountRecentRequestsByEmailAsync("user@example.com", since, CancellationToken.None))
            .Should()
            .Be(2);
        (await sut.CountRecentRequestsByClientIpHashAsync("ip-1", since, CancellationToken.None))
            .Should()
            .Be(2);
        (await sut.GetLatestRequestUtcByEmailAsync("user@example.com", CancellationToken.None))
            .Should()
            .NotBeNull();

        await sut.InvalidateActiveChallengesForEmailAsync(
            "user@example.com",
            TimeProvider.System.GetUtcNow(),
            CancellationToken.None);

        EmailOtpChallengeCompletionOutcome invalidated = await sut.TryCompleteAsync(
            knownId,
            "hash-a",
            TimeProvider.System.GetUtcNow(),
            maxFailedAttempts: 5,
            CancellationToken.None);

        invalidated.Result.Should().Be(EmailOtpChallengeCompletionResult.Invalidated);
    }

    [Fact]
    public async Task TryComplete_covers_not_found_expired_invalid_lockout_and_success()
    {
        InMemoryEmailOtpChallengeRepository sut = new();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        EmailOtpChallengeRecord active = await sut.InsertAsync(
            new EmailOtpChallengeInsert
            {
                NormalizedEmail = "otp@example.com",
                CodeHash = "correct-hash",
                ExpiresUtc = now.AddMinutes(5),
            },
            CancellationToken.None);

        EmailOtpChallengeRecord expired = await sut.InsertAsync(
            new EmailOtpChallengeInsert
            {
                NormalizedEmail = "otp@example.com",
                CodeHash = "expired-hash",
                ExpiresUtc = now.AddMinutes(-1),
            },
            CancellationToken.None);

        (await sut.TryCompleteAsync(Guid.NewGuid(), "x", now, 3, CancellationToken.None))
            .Result.Should()
            .Be(EmailOtpChallengeCompletionResult.NotFound);

        (await sut.TryCompleteAsync(expired.Id, "expired-hash", now, 3, CancellationToken.None))
            .Result.Should()
            .Be(EmailOtpChallengeCompletionResult.Expired);

        (await sut.TryCompleteAsync(active.Id, "wrong", now, maxFailedAttempts: 2, CancellationToken.None))
            .Result.Should()
            .Be(EmailOtpChallengeCompletionResult.InvalidCode);

        (await sut.CountRecentFailedVerificationsByEmailAsync("otp@example.com", now.AddMinutes(-1), CancellationToken.None))
            .Should()
            .Be(1);

        (await sut.TryCompleteAsync(active.Id, "wrong-again", now, maxFailedAttempts: 2, CancellationToken.None))
            .Result.Should()
            .Be(EmailOtpChallengeCompletionResult.TooManyAttempts);

        EmailOtpChallengeRecord fresh = await sut.InsertAsync(
            new EmailOtpChallengeInsert
            {
                NormalizedEmail = "otp@example.com",
                CodeHash = "ok-hash",
                ExpiresUtc = now.AddMinutes(5),
            },
            CancellationToken.None);

        EmailOtpChallengeCompletionOutcome completed = await sut.TryCompleteAsync(
            fresh.Id,
            "ok-hash",
            now,
            maxFailedAttempts: 5,
            CancellationToken.None);

        completed.Result.Should().Be(EmailOtpChallengeCompletionResult.Completed);
        completed.Challenge.Should().NotBeNull();

        (await sut.TryCompleteAsync(fresh.Id, "ok-hash", now, 5, CancellationToken.None))
            .Result.Should()
            .Be(EmailOtpChallengeCompletionResult.AlreadyCompleted);
    }
}

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class InMemoryEmailOtpChallengeRepositoryReplaceDuplicateIdTests
{
    [Fact]
    public async Task ReplaceActiveChallengeForEmailAsync_throws_when_new_challenge_id_collides_with_existing_row()
    {
        InMemoryEmailOtpChallengeRepository sut = new();
        DateTimeOffset expires = TimeProvider.System.GetUtcNow().AddMinutes(10);
        Guid sharedId = Guid.NewGuid();

        await sut.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = sharedId,
                NormalizedEmail = "other@example.com",
                CodeHash = "hash-other",
                ExpiresUtc = expires,
            },
            CancellationToken.None);

        Func<Task> act = () => sut.ReplaceActiveChallengeForEmailAsync(
            new EmailOtpChallengeInsert
            {
                Id = sharedId,
                NormalizedEmail = "user@example.com",
                CodeHash = "hash-new",
                ExpiresUtc = expires,
            },
            TimeProvider.System.GetUtcNow(),
            CancellationToken.None);

        await act.Should().ThrowAsync<DuplicateEmailOtpChallengeException>();
        (await sut.GetByIdAsync(sharedId, CancellationToken.None))!.NormalizedEmail.Should().Be("other@example.com");
    }
}

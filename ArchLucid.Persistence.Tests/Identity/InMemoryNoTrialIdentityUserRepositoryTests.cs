using ArchLucid.Persistence.Identity;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class InMemoryNoTrialIdentityUserRepositoryTests
{
    [Fact]
    public async Task GetByNormalizedEmail_returns_null()
    {
        InMemoryNoTrialIdentityUserRepository sut = new();

        (await sut.GetByNormalizedEmailAsync("user@example.com", CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task RecordAccessFailed_and_ResetAccessFailed_complete_without_error()
    {
        InMemoryNoTrialIdentityUserRepository sut = new();

        await sut.RecordAccessFailedAsync("user@example.com", 1, null, CancellationToken.None);
        await sut.ResetAccessFailedAsync("user@example.com", CancellationToken.None);
    }

    [Fact]
    public async Task CreatePendingUser_throws_not_supported()
    {
        InMemoryNoTrialIdentityUserRepository sut = new();

        Func<Task> act = () => sut.CreatePendingUserAsync(
            "user@example.com",
            "user@example.com",
            "hash",
            "stamp",
            "concurrency",
            "token",
            DateTimeOffset.UtcNow.AddHours(1),
            CancellationToken.None);

        await act.Should().ThrowAsync<NotSupportedException>();
    }

    [Fact]
    public async Task TryLinkLocalIdentityToEntra_throws_not_supported()
    {
        InMemoryNoTrialIdentityUserRepository sut = new();

        Func<Task> act = () => sut.TryLinkLocalIdentityToEntraAsync(
            "user@example.com",
            "entra-oid",
            CancellationToken.None);

        await act.Should().ThrowAsync<NotSupportedException>();
    }
}

using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryUserSettingsRepositoryTests
{
    [Fact]
    public async Task TryGetAsync_returns_null_until_upsert_round_trips_value()
    {
        InMemoryUserSettingsRepository sut = new();

        (await sut.TryGetAsync(" user-1 ", " theme ", CancellationToken.None)).Should().BeNull();

        await sut.UpsertAsync(" user-1 ", " theme ", " dark ", CancellationToken.None);

        (await sut.TryGetAsync("user-1", "theme", CancellationToken.None)).Should().Be("dark");
    }

    [Fact]
    public async Task UpsertAsync_rejects_blank_arguments()
    {
        InMemoryUserSettingsRepository sut = new();

        Func<Task> blankUser = () => sut.UpsertAsync(" ", "theme", "dark", CancellationToken.None);
        Func<Task> blankKey = () => sut.UpsertAsync("user", " ", "dark", CancellationToken.None);
        Func<Task> blankValue = () => sut.UpsertAsync("user", "theme", " ", CancellationToken.None);

        await blankUser.Should().ThrowAsync<ArgumentException>();
        await blankKey.Should().ThrowAsync<ArgumentException>();
        await blankValue.Should().ThrowAsync<ArgumentException>();
    }
}

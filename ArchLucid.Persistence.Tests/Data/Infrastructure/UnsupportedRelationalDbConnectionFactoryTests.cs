using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class UnsupportedRelationalDbConnectionFactoryTests
{
    [Fact]
    public void CreateConnection_throws()
    {
        UnsupportedRelationalDbConnectionFactory factory = new();

        Action act = () => factory.CreateConnection();

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public async Task CreateOpenConnectionAsync_throws()
    {
        UnsupportedRelationalDbConnectionFactory factory = new();

        Func<Task> act = async () => await factory.CreateOpenConnectionAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}

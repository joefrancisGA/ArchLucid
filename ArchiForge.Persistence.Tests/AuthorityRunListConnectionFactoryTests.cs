using ArchiForge.Persistence.Connections;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchiForge.Persistence.Tests;

/// <summary>
/// <see cref="AuthorityRunListConnectionFactory"/> delegates to the primary factory when no replica string is configured.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AuthorityRunListConnectionFactoryTests
{
    [Fact]
    public async Task CreateOpenConnectionAsync_WithoutReplica_Uses_primary_factory()
    {
        Mock<ISqlConnectionFactory> primary = new();
        SqlConnection expected = new();
        primary.Setup(p => p.CreateOpenConnectionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        Mock<IOptionsMonitor<ReadReplicaOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ReadReplicaOptions { AuthorityRunListReadsConnectionString = null });

        AuthorityRunListConnectionFactory sut = new(primary.Object, options.Object);

        SqlConnection actual = await sut.CreateOpenConnectionAsync(CancellationToken.None);

        actual.Should().BeSameAs(expected);
        primary.Verify(p => p.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

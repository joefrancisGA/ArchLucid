using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Transactions;

using Microsoft.Data.SqlClient;

using Moq;

namespace ArchLucid.Persistence.Tests.Transactions;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DapperArchLucidUnitOfWorkFactoryTests
{
    [Fact]
    public async Task CreateAsync_disposes_connection_when_begin_transaction_fails()
    {
        // An unopened connection deterministically rejects transaction startup without a live server.
        using SqlConnection connection = new();
        bool disposed = false;
        connection.Disposed += (_, _) => disposed = true;
        Mock<ISqlConnectionFactory> connectionFactory = new();
        connectionFactory.Setup(f => f.CreateOpenConnectionAsync(CancellationToken.None))
            .ReturnsAsync(connection);
        DapperArchLucidUnitOfWorkFactory sut = new(connectionFactory.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.CreateAsync(CancellationToken.None));

        disposed.Should().BeTrue();
    }
}

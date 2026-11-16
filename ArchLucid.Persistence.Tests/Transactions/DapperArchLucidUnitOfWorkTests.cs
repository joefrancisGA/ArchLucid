using System.Data;

using ArchLucid.Persistence.Transactions;

using Moq;

namespace ArchLucid.Persistence.Tests.Transactions;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DapperArchLucidUnitOfWorkTests
{
    [Fact]
    public async Task DisposeAsync_releases_connection_when_transaction_disposal_fails()
    {
        InvalidOperationException disposalFailure = new("Transaction disposal failed.");
        Mock<IDbConnection> connection = new();
        Mock<IDbTransaction> transaction = new();
        transaction.Setup(t => t.Dispose()).Throws(disposalFailure);
        DapperArchLucidUnitOfWork sut = new(connection.Object, transaction.Object);

        Exception? error = await Record.ExceptionAsync(async () => await sut.DisposeAsync());

        connection.Verify(c => c.Dispose(), Times.Once);
        error.Should().BeSameAs(disposalFailure);
    }
}

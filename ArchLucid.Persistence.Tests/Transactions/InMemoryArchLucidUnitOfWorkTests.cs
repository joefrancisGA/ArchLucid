using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Transactions;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Transactions;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryArchLucidUnitOfWorkTests
{
    [Fact]
    public async Task Factory_creates_unit_of_work_that_commits_and_disposes()
    {
        InMemoryArchLucidUnitOfWorkFactory factory = new();

        IArchLucidUnitOfWork unitOfWork = await factory.CreateAsync(CancellationToken.None);

        unitOfWork.SupportsExternalTransaction.Should().BeFalse();

        await unitOfWork.CommitAsync(CancellationToken.None);
        await unitOfWork.RollbackAsync(CancellationToken.None);
        await unitOfWork.DisposeAsync();
    }

    [Fact]
    public void Connection_and_transaction_are_not_supported()
    {
        InMemoryArchLucidUnitOfWork sut = new();

        Action connection = () => _ = sut.Connection;
        Action transaction = () => _ = sut.Transaction;

        connection.Should().Throw<NotSupportedException>();
        transaction.Should().Throw<NotSupportedException>();
    }
}

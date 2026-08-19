using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Persistence.CustomerSuccess;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.CustomerSuccess;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAdminTenantHealthReaderTests
{
    [Fact]
    public async Task ListSummariesAsync_returns_empty_list()
    {
        InMemoryAdminTenantHealthReader sut = new();

        IReadOnlyList<AdminTenantHealthSummaryRow> rows =
            await sut.ListSummariesAsync(CancellationToken.None);

        rows.Should().BeEmpty();
    }
}

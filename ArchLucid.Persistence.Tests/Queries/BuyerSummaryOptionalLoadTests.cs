using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Queries;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuyerSummaryOptionalLoadTests
{
    [Fact]
    public async Task SoftAsync_returns_null_when_load_throws()
    {
        string? result = await BuyerSummaryOptionalLoad.SoftAsync<string>(
            _ => throw new InvalidOperationException("corrupt satellite"),
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task SoftAsync_returns_value_when_load_succeeds()
    {
        string? result = await BuyerSummaryOptionalLoad.SoftAsync(
            _ => Task.FromResult<string?>("ok"),
            CancellationToken.None);

        result.Should().Be("ok");
    }

    [Fact]
    public async Task SoftListAsync_returns_empty_when_load_throws()
    {
        IReadOnlyList<string> result = await BuyerSummaryOptionalLoad.SoftListAsync(
            _ => throw new InvalidOperationException("trace fault"),
            CancellationToken.None);

        result.Should().BeEmpty();
    }
}

using ArchLucid.Persistence.Telemetry;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Telemetry;

[Trait("Category", "Unit")]
public sealed class NoopFirstTenantFunnelEventStoreTests
{
    [Fact]
    public async Task AppendAsync_completes_without_side_effects()
    {
        NoopFirstTenantFunnelEventStore sut = new();

        Func<Task> act = () => sut.AppendAsync(
            "tenant.created",
            Guid.NewGuid(),
            DateTime.UtcNow,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}

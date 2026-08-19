using ArchLucid.Persistence.Telemetry;

namespace ArchLucid.Persistence.Tests.Telemetry;

[Trait("Category", "Unit")]
public sealed class NoOpFirstTenantFunnelArchivalBatchStoreTests
{
    [Fact]
    public async Task TakeRowsOlderThanAsync_returns_empty_list()
    {
        NoOpFirstTenantFunnelArchivalBatchStore sut = new();

        IReadOnlyList<FirstTenantFunnelArchiveRow> rows =
            await sut.TakeRowsOlderThanAsync(30, 100, CancellationToken.None);

        rows.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteByEventIdsAsync_null_argument_throws()
    {
        NoOpFirstTenantFunnelArchivalBatchStore sut = new();

        Func<Task> act = async () => await sut.DeleteByEventIdsAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task DeleteByEventIdsAsync_accepts_ids()
    {
        NoOpFirstTenantFunnelArchivalBatchStore sut = new();

        Func<Task> act = async () => await sut.DeleteByEventIdsAsync([1, 2, 3], CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}

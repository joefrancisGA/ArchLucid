using ArchLucid.Persistence.Pilots;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Pilots;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryPilotBaselineRepositoryTests
{
    [Fact]
    public async Task GetAsync_returns_null_when_missing()
    {
        InMemoryPilotBaselineRepository sut = new();

        PilotBaselineRecord? record = await sut.GetAsync(Guid.NewGuid(), CancellationToken.None);

        record.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_then_GetAsync_returns_copied_record()
    {
        InMemoryPilotBaselineRepository sut = new();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DateTimeOffset updatedUtc = DateTimeOffset.Parse("2026-03-01T12:00:00Z");

        PilotBaselineRecord source = new()
        {
            TenantId = tenantId,
            BaselineHoursPerReview = 4.5m,
            BaselineReviewsPerQuarter = 12,
            BaselineArchitectHourlyCost = 175m,
            UpdatedUtc = updatedUtc,
        };

        await sut.UpsertAsync(source, CancellationToken.None);

        PilotBaselineRecord? loaded = await sut.GetAsync(tenantId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.TenantId.Should().Be(tenantId);
        loaded.BaselineHoursPerReview.Should().Be(4.5m);
        loaded.BaselineReviewsPerQuarter.Should().Be(12);
        loaded.BaselineArchitectHourlyCost.Should().Be(175m);
        loaded.UpdatedUtc.Should().Be(updatedUtc);
        loaded.Should().NotBeSameAs(source);
    }

    [Fact]
    public async Task UpsertAsync_throws_when_record_null()
    {
        InMemoryPilotBaselineRepository sut = new();

        Func<Task> act = async () => await sut.UpsertAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}

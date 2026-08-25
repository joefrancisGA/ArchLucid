using ArchLucid.Core.Metering;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Metering;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class NullUsageMeteringServiceTests
{
    [Fact]
    public async Task NullUsageMeteringService_is_no_op()
    {
        NullUsageMeteringService sut = new();
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset periodStart = new(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset periodEnd = new(2026, 8, 31, 0, 0, 0, TimeSpan.Zero);

        UsageEvent usageEvent = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 3,
            RecordedUtc = periodStart,
            CorrelationId = "corr-usage",
            IdempotencyKey = "idem-1",
        };

        await sut.RecordAsync(usageEvent, CancellationToken.None);
        await sut.RecordBatchAsync([usageEvent], CancellationToken.None);

        IReadOnlyList<TenantUsageSummary> summary = await sut.GetSummaryAsync(
            tenantId,
            periodStart,
            periodEnd,
            CancellationToken.None);

        summary.Should().BeEmpty();
    }
}

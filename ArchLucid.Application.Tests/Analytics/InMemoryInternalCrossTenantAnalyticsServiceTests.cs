using ArchLucid.Application.Analytics;
using ArchLucid.Core.Analytics;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Analytics;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Analytics;

public sealed class InMemoryInternalCrossTenantAnalyticsServiceTests
{
    [Fact]
    public async Task GetSummaryAsync_returns_empty_shaped_summary()
    {
        InMemoryInternalCrossTenantAnalyticsService sut = CreateSut();

        InternalCrossTenantAnalyticsSummary summary = await sut.GetSummaryAsync(CancellationToken.None);

        summary.CatalogsAggregated.Should().Be(0);
        summary.TotalRunsNonArchived.Should().Be(0);
        summary.TotalCompletedRuns.Should().Be(0);
        summary.AverageCompletedRunDurationSeconds.Should().BeNull();
        summary.TotalEstimatedEngineeringHoursSaved.Should().Be(0);
    }

    [Fact]
    public async Task RefreshDailyRollupsAsync_persists_surrogate_keyed_rows_without_tenant_id_in_export()
    {
        InMemoryInternalCrossTenantAnalyticsService sut = CreateSut();
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        DateOnly rollupDate = new(2026, 5, 16);

        IInternalCrossTenantMetricsCollector collector = new StubMetricsCollector(
            new InternalCrossTenantTenantRunMetrics
            {
                TenantId = tenantId,
                TotalRunsNonArchived = 4,
                TotalCompletedRuns = 3,
                SumCompletionSeconds = 30,
                EstimatedEngineeringHoursSaved = 2,
                LlmTokensUsed = 100,
            });

        InMemoryInternalCrossTenantRollupRepository repository = new();
        InternalCrossTenantRollupProcessor processor = CreateProcessor(collector, repository);
        InMemoryInternalCrossTenantAnalyticsService refreshSut = new(repository, processor);

        await refreshSut.RefreshDailyRollupsAsync(rollupDate, CancellationToken.None);

        IReadOnlyList<InternalCrossTenantRollupDailyRow> rows =
            await refreshSut.GetDailyRollupsAsync(rollupDate, CancellationToken.None);

        rows.Should().ContainSingle();
        rows[0].AnalyticsTenantKey.Should().HaveLength(64);

        string csv = refreshSut.ExportDailyRollupsCsv(rows);
        csv.Should().NotContain(tenantId.ToString());
    }

    private static InMemoryInternalCrossTenantAnalyticsService CreateSut()
    {
        InMemoryInternalCrossTenantRollupRepository repository = new();
        InternalCrossTenantRollupProcessor processor = CreateProcessor(
            new InMemoryInternalCrossTenantMetricsCollector(),
            repository);

        return new InMemoryInternalCrossTenantAnalyticsService(repository, processor);
    }

    private static InternalCrossTenantRollupProcessor CreateProcessor(
        IInternalCrossTenantMetricsCollector collector,
        IInternalCrossTenantRollupRepository repository)
    {
        Mock<IOptionsMonitor<InternalCrossTenantAnalyticsOptions>> options = new();
        options.Setup(o => o.CurrentValue)
            .Returns(new InternalCrossTenantAnalyticsOptions { PseudonymizationSalt = "application-test-salt" });

        return new InternalCrossTenantRollupProcessor(collector, repository, options.Object);
    }

    private sealed class StubMetricsCollector(InternalCrossTenantTenantRunMetrics metrics)
        : IInternalCrossTenantMetricsCollector
    {
        public Task<IReadOnlyList<InternalCrossTenantTenantRunMetrics>> CollectTenantMetricsAsync(
            DateOnly rollupDate,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<InternalCrossTenantTenantRunMetrics>>([metrics]);
        }
    }
}

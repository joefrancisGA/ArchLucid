using ArchLucid.Application.WeeklyArchitectureDigest;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.WeeklyDigest;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.WeeklyArchitectureDigest;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WeeklyArchitectureDigestJobRunnerTests
{
    private sealed class FixedUtcTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow()
            => new(DateTime.SpecifyKind(utcNow, DateTimeKind.Utc), TimeSpan.Zero);
    }

    [Fact]
    public async Task BuildDigestPayloadAsync_trims_critical_samples_and_preserves_total_count()
    {
        DateTime fixedUtc = new(2026, 5, 11, 12, 0, 0, DateTimeKind.Utc);
        WeeklyArchitectureDigestOptions snapshot = new()
        {
            Enabled = true,
            LookbackDays = 7,
            TopCriticalFindingCount = 3,
            CriticalFindingSampleFetchCap = 100,
        };

        Mock<IOptionsMonitor<WeeklyArchitectureDigestOptions>> optionsMonitor = new();
        optionsMonitor.SetupGet(m => m.CurrentValue).Returns(snapshot);

        List<WeeklyArchitectureCriticalFindingDto> samples =
        [
            BuildRow(1, fixedUtc.AddHours(-6)),
            BuildRow(2, fixedUtc.AddHours(-12)),
            BuildRow(3, fixedUtc.AddHours(-24)),
            BuildRow(4, fixedUtc.AddHours(-30)),
            BuildRow(5, fixedUtc.AddHours(-72)),
        ];

        WeeklyArchitectureCriticalFindingsSlice slice = new()
        {
            ApproximateMatchingCount = 42,
            SampleRows = samples,
        };

        Mock<IWeeklyArchitectureCriticalFindingSummaryRepository> repository = new();

        repository
            .Setup(r =>
                r.ListRecentCriticalAsync(
                    It.IsAny<DateTime>(),
                    FindingSeverity.Critical.ToString(),
                    It.IsAny<int>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(slice);

        WeeklyArchitectureDigestJobRunner runner =
            new(
                repository.Object,
                new FixedUtcTimeProvider(fixedUtc),
                optionsMonitor.Object,
                NullLogger<WeeklyArchitectureDigestJobRunner>.Instance);

        WeeklyArchitectureDigestLogPayload digest =
            await runner.BuildDigestPayloadAsync(CancellationToken.None);

        digest.ApproximateCriticalFindingCountLastWindow.Should().Be(42);
        digest.SummarizedCriticalFindings.Should().HaveCount(3);
        digest.SummarizedCriticalFindings.Should().Contain(line => line.FindingId == "finding-1");
        digest.CriticalSeverityKeyword.Should().Be(FindingSeverity.Critical.ToString());

        digest.IncludedSinceUtc.Should().Be(fixedUtc.AddDays(-snapshot.LookbackDays));

        repository.Verify(r =>
            r.ListRecentCriticalAsync(
                fixedUtc.AddDays(-snapshot.LookbackDays),
                FindingSeverity.Critical.ToString(),
                100,
                It.IsAny<CancellationToken>()), Times.Once);
    }

    private static WeeklyArchitectureCriticalFindingDto BuildRow(int ordinal, DateTime snapshotCreatedUtc)
    {
        Guid tenantId =
            Guid.Parse($"{ordinal:X8}-0000-4000-a000-{ordinal:X12}");

        return new WeeklyArchitectureCriticalFindingDto
        {
            FindingId = $"finding-{ordinal}",
            Title = $"title-{ordinal}",
            Category = $"cat-{ordinal}",
            TenantId = tenantId,
            SnapshotCreatedUtc = snapshotCreatedUtc,
        };
    }
}

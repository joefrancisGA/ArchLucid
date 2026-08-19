using ArchLucid.Core.Marketing;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Feedback;
using ArchLucid.Persistence.Feedback;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Value;
using ArchLucid.Persistence.WeeklyDigest;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class PersistencePackageCoverageBatch3Tests
{
    [Fact]
    public async Task InMemoryValueReportMetricsReader_returns_empty_metrics()
    {
        InMemoryValueReportMetricsReader sut = new();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;

        ValueReportRawMetrics metrics = await sut.ReadAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            from,
            to,
            CancellationToken.None);

        metrics.RunsCompletedCount.Should().Be(0);
        metrics.RunStatusCounts.Should().BeEmpty();
    }

    [Fact]
    public async Task InMemoryTenantFirstValueReportBrandingRepository_returns_null()
    {
        InMemoryTenantFirstValueReportBrandingRepository sut = new();

        TenantFirstValueReportBrandingRow? row =
            await sut.TryGetAsync(Guid.NewGuid(), CancellationToken.None);

        row.Should().BeNull();
    }

    [Fact]
    public async Task InMemoryWeeklyArchitectureCriticalFindingSummaryRepository_returns_empty_slice()
    {
        InMemoryWeeklyArchitectureCriticalFindingSummaryRepository sut = new();

        WeeklyArchitectureCriticalFindingsSlice slice = await sut.ListRecentCriticalAsync(
            DateTime.UtcNow.AddDays(-7),
            criticalSeverityLiteral: "Critical",
            maxSampleRows: 10,
            CancellationToken.None);

        slice.ApproximateMatchingCount.Should().Be(0);
        slice.SampleRows.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpTenantSqlCatalogProvisioner_completes_without_side_effects()
    {
        NoOpTenantSqlCatalogProvisioner sut = new();

        await sut.Invoking(
                s => s.ProvisionTenantCatalogAsync(Guid.NewGuid(), "db-name", CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpArchitectureProjectRetentionPurgeService_returns_empty_deletions()
    {
        NoOpArchitectureProjectRetentionPurgeService sut = new();

        IReadOnlyList<ArchitectureProjectPurgeDeletion> deleted =
            await sut.PurgeExpiredAsync(DateTimeOffset.UtcNow, CancellationToken.None);

        deleted.Should().BeEmpty();
    }

    [Fact]
    public async Task InMemoryPilotCloseoutRepository_accepts_insert()
    {
        InMemoryPilotCloseoutRepository sut = new();
        PilotCloseoutRecord row = new()
        {
            CloseoutId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SpeedScore = 4,
            ManifestPackageScore = 5,
            TraceabilityScore = 5,
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        await sut.Invoking(s => s.InsertAsync(row, CancellationToken.None)).Should().NotThrowAsync();
    }

    [Fact]
    public async Task InMemoryFindingFeedbackRepository_accepts_insert()
    {
        InMemoryFindingFeedbackRepository sut = new();
        FindingFeedbackSubmission submission = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            FindingId = "finding-1",
            Score = 1,
        };

        await sut.Invoking(s => s.InsertAsync(submission, CancellationToken.None)).Should().NotThrowAsync();
    }
}

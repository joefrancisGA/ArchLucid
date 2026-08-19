using ArchLucid.Core.Marketing;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Telemetry;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class PersistencePackageCoverageBatch14Tests
{
    [Fact]
    public async Task NoOpAuditEventChangeFeedHandler_completes_without_side_effects()
    {
        NoOpAuditEventChangeFeedHandler sut = new();
        AuditEventDocument document = new() { Id = "audit-1", EventType = "test.event" };

        Func<Task> act = async () => await sut.HandleAsync([document], CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SqlPrimaryMirroredReadReplicaConnectionFactory_delegates_to_primary_factory()
    {
        Mock<ISqlConnectionFactory> primary = new();
        SqlConnection expected = new("Server=.;Database=test;Encrypt=True;TrustServerCertificate=True;");
        primary.Setup(p => p.CreateOpenConnectionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        SqlPrimaryMirroredReadReplicaConnectionFactory sut = new(primary.Object);

        SqlConnection actual = await sut.CreateOpenConnectionAsync(CancellationToken.None);

        actual.Should().BeSameAs(expected);
    }

    [Fact]
    public void SqlPrimaryMirroredReadReplicaConnectionFactory_throws_when_primary_is_null()
    {
        Action act = () => _ = new SqlPrimaryMirroredReadReplicaConnectionFactory(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task NoOpTenantMarketingAttributionRepository_returns_false_on_insert()
    {
        NoOpTenantMarketingAttributionRepository sut = new();
        MarketingAttributionSnapshot snapshot = new()
        {
            UtmSource = "newsletter",
            UtmMedium = "email",
            UtmCampaign = "launch",
        };

        bool inserted = await sut.TryInsertFirstTouchAsync(
            Guid.NewGuid(),
            snapshot,
            coarseMedium: "email",
            coarsePlatform: "web",
            CancellationToken.None);

        inserted.Should().BeFalse();
    }

    [Fact]
    public async Task NoOpWarmTenantCatalogStandbyRepository_reports_zero_unclaimed_rows()
    {
        NoOpWarmTenantCatalogStandbyRepository sut = new();

        (await sut.CountUnclaimedAsync(CancellationToken.None)).Should().Be(0);
        (await sut.TryClaimOldestUnclaimedAsync(CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task NoOpFirstTenantFunnelArchivalBatchStore_returns_empty_batch()
    {
        NoOpFirstTenantFunnelArchivalBatchStore sut = new();

        IReadOnlyList<FirstTenantFunnelArchiveRow> rows =
            await sut.TakeRowsOlderThanAsync(retentionDays: 30, maxRows: 10, CancellationToken.None);

        rows.Should().BeEmpty();
    }

    [Fact]
    public void NamedQueryTelemetryNames_exposes_stable_query_name_constants()
    {
        NamedQueryTelemetryNames.GetRunsByTenantId.Should().NotBeNullOrWhiteSpace();
        NamedQueryTelemetryNames.GetGoldenManifestById.Should().NotBeNullOrWhiteSpace();
        NamedQueryTelemetryNames.ListAuditEventsFiltered.Should().NotBeNullOrWhiteSpace();
    }
}

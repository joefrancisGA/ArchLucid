using ArchLucid.Contracts.Common;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class PersistenceNullAndNoOpStubCoverageTests
{
    [Fact]
    public async Task NullSponsorReportRecipientLookup_returns_empty_list()
    {
        NullSponsorReportRecipientLookup sut = new();

        IReadOnlyList<string> recipients =
            await sut.ListRecipientMailboxesAsync(Guid.NewGuid(), CancellationToken.None);

        recipients.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpAgentConfidenceCalibrationSampleRepository_completes_append_and_returns_empty_recent()
    {
        NoOpAgentConfidenceCalibrationSampleRepository sut = new();

        await sut.AppendAsync(AgentType.Topology, 0.8, 0.9, CancellationToken.None);

        IReadOnlyList<AgentConfidenceCalibrationSampleRow> recent =
            await sut.GetRecentByAgentTypeAsync(AgentType.Topology, 10, CancellationToken.None);

        recent.Should().BeEmpty();
    }

    [Fact]
    public async Task NullPilotReportCardMetricsReader_returns_empty_scope_metrics()
    {
        NullPilotReportCardMetricsReader sut = new();

        PilotReportCardScopeMetrics metrics = await sut.ReadAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            CancellationToken.None);

        metrics.FindingsBySeverity.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpTenantHardPurgeService_returns_empty_result()
    {
        NoOpTenantHardPurgeService sut = new();

        TenantHardPurgeResult result = await sut.PurgeTenantAsync(
            Guid.NewGuid(),
            new TenantHardPurgeOptions(),
            CancellationToken.None);

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task UnusedSystemSqlConnectionFactory_throws_when_opening_connection()
    {
        UnusedSystemSqlConnectionFactory sut = new();

        sut.SystemConnectionString.Should().BeEmpty();

        Func<Task> act = () => sut.CreateOpenConnectionAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*InMemory*");
    }

    [Fact]
    public async Task UnusedTenantSqlConnectionFactory_throws_when_opening_connection()
    {
        UnusedTenantSqlConnectionFactory sut = new();

        Func<Task> act = () => sut.CreateOpenConnectionAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*InMemory*");
    }
}

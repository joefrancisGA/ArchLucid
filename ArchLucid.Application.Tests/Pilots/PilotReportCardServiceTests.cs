using ArchLucid.Application.Pilots;

using ArchLucid.Contracts.Pilots;

using ArchLucid.Core.Scoping;

using ArchLucid.Persistence.Pilots;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class PilotReportCardServiceTests
{
    [Fact]
    public async Task GenerateReportCardAsync_WhenCallerScopeDoesNotMatchIds_ThrowsArgumentException()
    {
        Mock<IPilotReportCardMetricsReader> metricsReader = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Guid alignedTenant = Guid.NewGuid();

        ScopeContext canonical =
            new()
            {
                TenantId = alignedTenant,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            };

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(canonical);

        PilotReportCardService sut = new(metricsReader.Object, scopeProvider.Object);

        Guid misalignedTenant = Guid.NewGuid();
        Func<Task> act =
            async () =>
                await sut.GenerateReportCardAsync(misalignedTenant, canonical.WorkspaceId, canonical.ProjectId,
                    CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
        metricsReader.Verify(
            reader => reader.ReadAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GenerateReportCardAsync_ProjectsSeverityBucketsAndTotals()
    {
        Mock<IPilotReportCardMetricsReader> metricsReader = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Guid tenantId = Guid.NewGuid();

        ScopeContext canonical =
            new()
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            };

        metricsReader.Setup(m => m.ReadAsync(tenantId, canonical.WorkspaceId, canonical.ProjectId, CancellationToken.None))
            .ReturnsAsync(new PilotReportCardScopeMetrics
            {
                TotalCompletedRuns = 2,
                PeriodStartUtc = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc),
                PeriodEndUtc = new DateTime(2026, 5, 1, 14, 0, 0, DateTimeKind.Utc),
                AverageRequestToCommitWallSeconds = 450.75,
                TotalFindings = 4,
                FindingsBySeverity =
                [
                    new PilotReportCardSeverityCountRow { Severity = "Critical", SeverityBucketCount = 1 },
                    new PilotReportCardSeverityCountRow { Severity = "Warning", SeverityBucketCount = 3 }
                ],
                GovernanceApprovalActions = 5,
                GovernanceRejections = 1,
                ExportsGenerated = 20,
                UniqueSynthesizedArtifactTypes = 6
            });
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(canonical);
        PilotReportCardService sut = new(metricsReader.Object, scopeProvider.Object);

        PilotReportCard actual =
            await sut.GenerateReportCardAsync(tenantId, canonical.WorkspaceId, canonical.ProjectId,
                CancellationToken.None);

        actual.TenantId.Should().Be(tenantId);
        actual.WorkspaceId.Should().Be(canonical.WorkspaceId);
        actual.ScopeProjectId.Should().Be(canonical.ProjectId);
        actual.TotalCompletedRuns.Should().Be(2);
        actual.PeriodStartUtc.Should().NotBeNull();
        actual.PeriodEndUtc.Should().NotBeNull();
        actual.AverageRequestToCommitWallSeconds.Should().Be(450.75);
        actual.TotalFindings.Should().Be(4);
        actual.GovernanceApprovalActions.Should().Be(5);
        actual.GovernanceRejections.Should().Be(1);
        actual.ExportsGenerated.Should().Be(20);
        actual.UniqueSynthesizedArtifactTypes.Should().Be(6);
        actual.FindingsBySeverity.Should().HaveCount(2);
        actual.FindingsBySeverity.Single(s => s.Severity == "Critical").Count.Should().Be(1);
        actual.FindingsBySeverity.Single(s => s.Severity == "Warning").Count.Should().Be(3);
    }
}

using ArchLucid.Application.InfraEvidence.RemediationMetrics;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationFactoryMetricsServiceTests
{
    [Fact]
    public async Task GetMetricsAsync_uses_aggregate_reads_not_full_scope_lists()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ProjectScopeKey projectScope = ProjectScopeKey.Create(tenantId, workspaceId, projectId);

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        Mock<IProjectScopedOperationalSecurityFindingRepository> findings = new();
        findings
            .Setup(repository => repository.GetFactoryFindingMetricsAggregateInScopeAsync(
                projectScope,
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RemediationFactoryFindingMetricsAggregate
            {
                OpenFindings = 2,
                CriticalExposureCount = 1,
                CreatedThisWeek = 3,
                RecurrenceCount = 1,
                AverageAgeDays = 4.5,
                TopControlIds = [new RemediationFactoryMetricKeyCount { Key = "AC-1", Count = 2 }],
            });

        Mock<IProjectScopedRemediationInstanceRepository> instances = new();
        instances
            .Setup(repository => repository.GetFactoryInstanceMetricsAggregateInScopeAsync(
                projectScope,
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RemediationFactoryInstanceMetricsAggregate
            {
                TotalInstances = 4,
                RemediatedThisWeek = 1,
                AutomatedCount = 2,
                VerificationFailureCount = 1,
                BusinessBlockedCount = 1,
                TopPatternKeys = [new RemediationFactoryMetricKeyCount { Key = "pat-a", Count = 2 }],
            });

        Mock<IOperationalSecurityExceptionRepository> exceptions = new();
        exceptions
            .Setup(repository => repository.GetFactoryExceptionMetricsAggregateInScopeAsync(
                projectScope,
                It.IsAny<DateTime>(),
                It.IsAny<TimeSpan>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RemediationFactoryExceptionMetricsAggregate
            {
                ExceptionsActive = 2,
                ExceptionsExpiringSoon = 1,
                ExceptionsExpired = 1,
            });

        Mock<IRemediationPrioritizationRepository> prioritization = new();
        prioritization
            .Setup(repository => repository.SumTotalScoresForOpenFindingsInScopeAsync(projectScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(12.3456m);

        Mock<IRemediationPatternMatchRepository> matches = new();
        matches
            .Setup(repository => repository.ListActiveMatchesByOpenFindingInScopeAsync(projectScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, RemediationPatternMatchResultRecord>());

        RemediationFactoryMetricsService service = new(
            findings.Object,
            exceptions.Object,
            matches.Object,
            instances.Object,
            prioritization.Object);

        RemediationFactoryMetrics metrics = await service.GetMetricsAsync(scope, CancellationToken.None);

        metrics.OpenFindings.Should().Be(2);
        metrics.NetBurn.Should().Be(2);
        metrics.RiskWeightedOpen.Should().Be(12.3456m);
        metrics.AutomationPercent.Should().Be(50m);
        metrics.TopControlIds.Should().ContainSingle().Which.Key.Should().Be("AC-1");

        findings.Verify(
            repository => repository.ListByScopeAsync(It.IsAny<ProjectScopeKey>(), It.IsAny<OperationalSecurityFindingStatus?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        instances.Verify(repository => repository.ListByScopeAsync(It.IsAny<ProjectScopeKey>(), It.IsAny<CancellationToken>()), Times.Never);
        exceptions.Verify(repository => repository.ListByScopeAsync(It.IsAny<ProjectScopeKey>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}

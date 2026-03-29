using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Advisory.Delivery;
using ArchiForge.Decisioning.Advisory.Learning;
using ArchiForge.Decisioning.Advisory.Models;
using ArchiForge.Decisioning.Advisory.Scheduling;
using ArchiForge.Decisioning.Advisory.Services;
using ArchiForge.Decisioning.Advisory.Workflow;
using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;
using ArchiForge.Decisioning.Comparison;
using ArchiForge.Decisioning.Governance.PolicyPacks;
using ArchiForge.Decisioning.Models;
using ArchiForge.Persistence.Advisory;
using ArchiForge.Persistence.Models;
using ArchiForge.Persistence.Queries;

using Moq;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// Tests for Advisory Scan Runner.
/// </summary>

[Trait("Category", "Unit")]
public sealed class AdvisoryScanRunnerTests
{
    [Fact]
    public async Task RunScheduleAsync_WhenNoRuns_CompletesExecutionAndAdvancesSchedule()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(x => x.ListRunsByProjectAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAdvisoryScanExecutionRepository> executions = new();
        executions
            .Setup(x => x.CreateAsync(It.IsAny<AdvisoryScanExecution>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        executions
            .Setup(x => x.UpdateAsync(It.IsAny<AdvisoryScanExecution>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAdvisoryScanScheduleRepository> schedules = new();
        schedules
            .Setup(x => x.UpdateAsync(It.IsAny<AdvisoryScanSchedule>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScanScheduleCalculator> calculator = new();
        calculator
            .Setup(x => x.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>()))
            .Returns(DateTime.UtcNow.AddDays(1));

        Mock<IAuditService> audit = new();
        audit
            .Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AdvisoryScanRunner sut = new(
            authority.Object,
            Mock.Of<IImprovementAdvisorService>(),
            Mock.Of<IComparisonService>(),
            Mock.Of<IArchitectureDigestBuilder>(),
            Mock.Of<IArchitectureDigestRepository>(),
            Mock.Of<IDigestDeliveryDispatcher>(),
            Mock.Of<IAlertService>(),
            Mock.Of<ICompositeAlertService>(),
            Mock.Of<IEffectiveGovernanceLoader>(),
            Mock.Of<IRecommendationRepository>(),
            Mock.Of<IRecommendationLearningService>(),
            executions.Object,
            schedules.Object,
            calculator.Object,
            audit.Object);

        AdvisoryScanSchedule schedule = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunProjectSlug = "default"
        };

        await sut.RunScheduleAsync(schedule, CancellationToken.None);

        executions.Verify(
            x => x.UpdateAsync(It.Is<AdvisoryScanExecution>(e => e.Status == "Completed"), It.IsAny<CancellationToken>()),
            Times.Once);
        schedules.Verify(x => x.UpdateAsync(It.IsAny<AdvisoryScanSchedule>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task RunScheduleAsync_WhenLatestRunHasGoldenManifest_PersistsDigestAndDelivers()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid digestId = Guid.NewGuid();

        GoldenManifest manifest = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            ManifestHash = "h",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
        };

        RunRecord runRecord = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = projectId,
            RunId = runId,
            ProjectId = "default",
            CreatedUtc = DateTime.UtcNow,
            GoldenManifestId = manifest.ManifestId,
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(x => x.ListRunsByProjectAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new RunSummaryDto { RunId = runId, CreatedUtc = DateTime.UtcNow, ProjectId = "default" }]);
        authority
            .Setup(x => x.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunDetailDto
                {
                    Run = runRecord,
                    GoldenManifest = manifest,
                    FindingsSnapshot = null,
                });

        Mock<IImprovementAdvisorService> advisor = new();
        advisor
            .Setup(x => x.GeneratePlanAsync(It.IsAny<GoldenManifest>(), It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImprovementPlan { RunId = runId, Recommendations = [] });

        Mock<IRecommendationRepository> recommendations = new();
        recommendations
            .Setup(x => x.ListByRunAsync(tenantId, workspaceId, projectId, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRecommendationLearningService> learning = new();
        learning
            .Setup(x => x.GetLatestProfileAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RecommendationLearningProfile?)null);

        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(x => x.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        Mock<IAlertService> simpleAlerts = new();
        simpleAlerts
            .Setup(x => x.EvaluateAndPersistAsync(It.IsAny<AlertEvaluationContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertEvaluationOutcome([], []));

        Mock<ICompositeAlertService> compositeAlerts = new();
        compositeAlerts
            .Setup(x => x.EvaluateAndPersistAsync(It.IsAny<AlertEvaluationContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CompositeAlertEvaluationResult([], 0));

        ArchitectureDigest builtDigest = new()
        {
            DigestId = digestId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunId = runId,
            Title = "t",
            Summary = "s",
            ContentMarkdown = "m",
        };

        Mock<IArchitectureDigestBuilder> digestBuilder = new();
        digestBuilder
            .Setup(
                x => x.Build(
                    tenantId,
                    workspaceId,
                    projectId,
                    runId,
                    null,
                    It.IsAny<ImprovementPlan>(),
                    It.IsAny<IReadOnlyList<AlertRecord>>()))
            .Returns(builtDigest);

        Mock<IArchitectureDigestRepository> digestRepo = new();
        digestRepo.Setup(x => x.CreateAsync(It.IsAny<ArchitectureDigest>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IDigestDeliveryDispatcher> delivery = new();
        delivery.Setup(x => x.DeliverAsync(It.IsAny<ArchitectureDigest>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAdvisoryScanExecutionRepository> executions = new();
        executions
            .Setup(x => x.CreateAsync(It.IsAny<AdvisoryScanExecution>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        executions
            .Setup(x => x.UpdateAsync(It.IsAny<AdvisoryScanExecution>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAdvisoryScanScheduleRepository> schedules = new();
        schedules
            .Setup(x => x.UpdateAsync(It.IsAny<AdvisoryScanSchedule>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScanScheduleCalculator> calculator = new();
        calculator
            .Setup(x => x.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>()))
            .Returns(DateTime.UtcNow.AddDays(1));

        Mock<IAuditService> audit = new();
        audit
            .Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AdvisoryScanRunner sut = new(
            authority.Object,
            advisor.Object,
            Mock.Of<IComparisonService>(),
            digestBuilder.Object,
            digestRepo.Object,
            delivery.Object,
            simpleAlerts.Object,
            compositeAlerts.Object,
            governance.Object,
            recommendations.Object,
            learning.Object,
            executions.Object,
            schedules.Object,
            calculator.Object,
            audit.Object);

        AdvisoryScanSchedule schedule = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunProjectSlug = "default",
        };

        await sut.RunScheduleAsync(schedule, CancellationToken.None);

        digestRepo.Verify(x => x.CreateAsync(It.Is<ArchitectureDigest>(d => d.DigestId == digestId), It.IsAny<CancellationToken>()), Times.Once);
        delivery.Verify(x => x.DeliverAsync(It.Is<ArchitectureDigest>(d => d.DigestId == digestId), It.IsAny<CancellationToken>()), Times.Once);
    }
}

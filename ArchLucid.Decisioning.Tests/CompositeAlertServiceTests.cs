using ArchiForge.Core.Audit;
using ArchiForge.Core.Integration;
using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;
using ArchiForge.Decisioning.Alerts.Delivery;
using ArchiForge.Decisioning.Governance.PolicyPacks;

using ArchiForge.Persistence.Alerts;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// Tests for Composite Alert Service.
/// </summary>

[Trait("Category", "Unit")]
public sealed class CompositeAlertServiceTests
{
    [Fact]
    public async Task EvaluateAndPersistAsync_WhenNoRules_ReturnsEmptyWithoutPersistence()
    {
        Mock<ICompositeAlertRuleRepository> rules = new();
        rules
            .Setup(x => x.ListEnabledByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(x => x.LoadEffectiveContentAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        Mock<IAlertRecordRepository> alerts = new();

        CompositeAlertService sut = CreateSut(
            rules.Object,
            Mock.Of<IAlertMetricSnapshotBuilder>(),
            Mock.Of<ICompositeAlertRuleEvaluator>(),
            Mock.Of<IAlertSuppressionPolicy>(),
            alerts.Object,
            Mock.Of<IAlertDeliveryDispatcher>(),
            Mock.Of<IAuditService>(),
            governance.Object);

        AlertEvaluationContext context = CreateContext(preloadedGovernance: null);

        CompositeAlertEvaluationResult result = await sut.EvaluateAndPersistAsync(context, CancellationToken.None);

        result.Created.Should().BeEmpty();
        result.SuppressedMatchCount.Should().Be(0);
        alerts.Verify(x => x.CreateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Never);
        governance.Verify(
            x => x.LoadEffectiveContentAsync(context.TenantId, context.WorkspaceId, context.ProjectId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task EvaluateAndPersistAsync_WhenGovernancePreloaded_SkipsLoader()
    {
        Mock<ICompositeAlertRuleRepository> rules = new();
        rules
            .Setup(x => x.ListEnabledByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(x => x.LoadEffectiveContentAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        CompositeAlertService sut = CreateSut(
            rules.Object,
            Mock.Of<IAlertMetricSnapshotBuilder>(),
            Mock.Of<ICompositeAlertRuleEvaluator>(),
            Mock.Of<IAlertSuppressionPolicy>(),
            Mock.Of<IAlertRecordRepository>(),
            Mock.Of<IAlertDeliveryDispatcher>(),
            Mock.Of<IAuditService>(),
            governance.Object);

        AlertEvaluationContext context = CreateContext(preloadedGovernance: new PolicyPackContentDocument());

        _ = await sut.EvaluateAndPersistAsync(context, CancellationToken.None);

        governance.Verify(
            x => x.LoadEffectiveContentAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EvaluateAndPersistAsync_WhenRuleMatchesAndSuppressionAllows_PersistsDeliversAndAudits()
    {
        CompositeAlertRule rule = new()
        {
            CompositeRuleId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Name = "Composite test",
            Severity = AlertSeverity.Warning,
            Conditions = [],
        };

        Mock<ICompositeAlertRuleRepository> rules = new();
        rules
            .Setup(x => x.ListEnabledByScopeAsync(rule.TenantId, rule.WorkspaceId, rule.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([rule]);

        AlertMetricSnapshot snapshot = new();

        Mock<IAlertMetricSnapshotBuilder> metrics = new();
        metrics.Setup(x => x.Build(It.IsAny<AlertEvaluationContext>())).Returns(snapshot);

        Mock<ICompositeAlertRuleEvaluator> evaluator = new();
        evaluator.Setup(x => x.Evaluate(rule, snapshot)).Returns(true);

        Mock<IAlertSuppressionPolicy> suppression = new();
        suppression
            .Setup(x => x.DecideAsync(rule, It.IsAny<AlertEvaluationContext>(), snapshot, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new AlertSuppressionDecision
                {
                    ShouldCreateAlert = true,
                    Reason = "ok",
                    DeduplicationKey = "dk",
                });

        Mock<IAlertRecordRepository> alerts = new();
        alerts.Setup(x => x.CreateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAlertDeliveryDispatcher> delivery = new();
        delivery.Setup(x => x.DeliverAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(x => x.LoadEffectiveContentAsync(rule.TenantId, rule.WorkspaceId, rule.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        CompositeAlertService sut = CreateSut(
            rules.Object,
            metrics.Object,
            evaluator.Object,
            suppression.Object,
            alerts.Object,
            delivery.Object,
            audit.Object,
            governance.Object);

        AlertEvaluationContext context = CreateContext(
            preloadedGovernance: new PolicyPackContentDocument(),
            tenantId: rule.TenantId,
            workspaceId: rule.WorkspaceId,
            projectId: rule.ProjectId);

        CompositeAlertEvaluationResult result = await sut.EvaluateAndPersistAsync(context, CancellationToken.None);

        result.Created.Should().ContainSingle();
        alerts.Verify(x => x.CreateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Once);
        delivery.Verify(x => x.DeliverAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(
            x => x.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.CompositeAlertTriggered), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task EvaluateAndPersistAsync_WhenSuppressed_IncrementsSuppressedCountAndAudits()
    {
        CompositeAlertRule rule = new()
        {
            CompositeRuleId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Name = "Suppressed",
            Severity = AlertSeverity.Info,
            Conditions = [],
        };

        Mock<ICompositeAlertRuleRepository> rules = new();
        rules
            .Setup(x => x.ListEnabledByScopeAsync(rule.TenantId, rule.WorkspaceId, rule.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([rule]);

        AlertMetricSnapshot snapshot = new();

        Mock<IAlertMetricSnapshotBuilder> metrics = new();
        metrics.Setup(x => x.Build(It.IsAny<AlertEvaluationContext>())).Returns(snapshot);

        Mock<ICompositeAlertRuleEvaluator> evaluator = new();
        evaluator.Setup(x => x.Evaluate(rule, snapshot)).Returns(true);

        Mock<IAlertSuppressionPolicy> suppression = new();
        suppression
            .Setup(x => x.DecideAsync(rule, It.IsAny<AlertEvaluationContext>(), snapshot, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new AlertSuppressionDecision
                {
                    ShouldCreateAlert = false,
                    Reason = "quiet hours",
                    DeduplicationKey = "dk",
                });

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(x => x.LoadEffectiveContentAsync(rule.TenantId, rule.WorkspaceId, rule.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        CompositeAlertService sut = CreateSut(
            rules.Object,
            metrics.Object,
            evaluator.Object,
            suppression.Object,
            Mock.Of<IAlertRecordRepository>(),
            Mock.Of<IAlertDeliveryDispatcher>(),
            audit.Object,
            governance.Object);

        AlertEvaluationContext context = CreateContext(
            preloadedGovernance: new PolicyPackContentDocument(),
            tenantId: rule.TenantId,
            workspaceId: rule.WorkspaceId,
            projectId: rule.ProjectId);

        CompositeAlertEvaluationResult result = await sut.EvaluateAndPersistAsync(context, CancellationToken.None);

        result.SuppressedMatchCount.Should().Be(1);
        result.Created.Should().BeEmpty();
        audit.Verify(
            x => x.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertSuppressedByPolicy), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static CompositeAlertService CreateSut(
        ICompositeAlertRuleRepository ruleRepository,
        IAlertMetricSnapshotBuilder snapshotBuilder,
        ICompositeAlertRuleEvaluator ruleEvaluator,
        IAlertSuppressionPolicy suppressionPolicy,
        IAlertRecordRepository alertRepository,
        IAlertDeliveryDispatcher alertDeliveryDispatcher,
        IAuditService auditService,
        IEffectiveGovernanceLoader effectiveGovernanceLoader,
        IIntegrationEventPublisher? integrationEvents = null,
        ILogger<CompositeAlertService>? logger = null) =>
        new(
            ruleRepository,
            snapshotBuilder,
            ruleEvaluator,
            suppressionPolicy,
            alertRepository,
            alertDeliveryDispatcher,
            auditService,
            effectiveGovernanceLoader,
            integrationEvents ?? Mock.Of<IIntegrationEventPublisher>(),
            logger ?? NullLogger<CompositeAlertService>.Instance);

    private static AlertEvaluationContext CreateContext(
        PolicyPackContentDocument? preloadedGovernance,
        Guid? tenantId = null,
        Guid? workspaceId = null,
        Guid? projectId = null) =>
        new()
        {
            TenantId = tenantId ?? Guid.NewGuid(),
            WorkspaceId = workspaceId ?? Guid.NewGuid(),
            ProjectId = projectId ?? Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ImprovementPlan = new(),
            EffectiveGovernanceContent = preloadedGovernance,
        };
}

using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Compliance;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class PersistencePackageCoverageBatch2Tests
{
    [Fact]
    public async Task AlertService_evaluate_and_persist_creates_delivers_and_audits_new_alert()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        AlertRule rule = new()
        {
            RuleId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Name = "rule",
            Severity = AlertSeverity.Warning,
            IsEnabled = true,
        };
        AlertRecord generated = new()
        {
            AlertId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RuleId = rule.RuleId,
            Title = "title",
            Severity = AlertSeverity.Warning,
            DeduplicationKey = "dedup-1",
            Status = AlertStatus.Open,
        };
        Mock<IAlertRuleRepository> ruleRepo = new();
        ruleRepo
            .Setup(r => r.ListEnabledByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([rule]);
        Mock<IAlertRecordRepository> alertRepo = new();
        alertRepo
            .Setup(r => r.GetOpenByDeduplicationKeyAsync(tenantId, workspaceId, projectId, generated.DeduplicationKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AlertRecord?)null);
        alertRepo.Setup(r => r.CreateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IAlertEvaluator> evaluator = new();
        evaluator.Setup(e => e.Evaluate(It.IsAny<IReadOnlyList<AlertRule>>(), It.IsAny<AlertEvaluationContext>()))
            .Returns([generated]);
        Mock<IAlertDeliveryDispatcher> dispatcher = new();
        dispatcher.Setup(d => d.DeliverAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(g => g.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());
        Mock<IIntegrationEventPublisher> integration = new();
        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOptions = new();
        integrationOptions.Setup(o => o.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });
        AlertService sut = new(
            ruleRepo.Object,
            alertRepo.Object,
            evaluator.Object,
            dispatcher.Object,
            audit.Object,
            governance.Object,
            integration.Object,
            outbox.Object,
            integrationOptions.Object,
            NullLogger<AlertService>.Instance);
        AlertEvaluationContext context = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunId = Guid.NewGuid(),
            EffectiveGovernanceContent = new PolicyPackContentDocument(),
        };

        AlertEvaluationOutcome outcome = await sut.EvaluateAndPersistAsync(context, CancellationToken.None);

        outcome.Evaluated.Should().ContainSingle();
        outcome.NewlyPersisted.Should().ContainSingle();
        dispatcher.Verify(d => d.DeliverAsync(generated, It.IsAny<CancellationToken>()), Times.Once);
        governance.Verify(
            g => g.LoadEffectiveContentAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AlertService_evaluate_and_persist_skips_duplicate_dedup_key()
    {
        Guid tenantId = Guid.NewGuid();
        AlertRecord generated = new()
        {
            AlertId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            DeduplicationKey = "dup",
            Title = "dup",
            Severity = AlertSeverity.Info,
            Status = AlertStatus.Open,
        };
        Mock<IAlertRuleRepository> ruleRepo = new();
        ruleRepo
            .Setup(r => r.ListEnabledByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        Mock<IAlertRecordRepository> alertRepo = new();
        alertRepo
            .Setup(r => r.GetOpenByDeduplicationKeyAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), generated.DeduplicationKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertRecord { AlertId = Guid.NewGuid(), DeduplicationKey = generated.DeduplicationKey });
        Mock<IAlertEvaluator> evaluator = new();
        evaluator.Setup(e => e.Evaluate(It.IsAny<IReadOnlyList<AlertRule>>(), It.IsAny<AlertEvaluationContext>()))
            .Returns([generated]);
        Mock<IAlertDeliveryDispatcher> dispatcher = new();
        AlertService sut = BuildAlertService(ruleRepo, alertRepo, evaluator, dispatcher);

        AlertEvaluationOutcome outcome = await sut.EvaluateAndPersistAsync(
            new AlertEvaluationContext
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                EffectiveGovernanceContent = new PolicyPackContentDocument(),
            },
            CancellationToken.None);

        outcome.NewlyPersisted.Should().BeEmpty();
        alertRepo.Verify(r => r.CreateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Never);
        dispatcher.Verify(d => d.DeliverAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AlertDeliveryDispatcher_delivers_matching_subscription_and_audits_success()
    {
        Guid tenantId = Guid.NewGuid();
        AlertRecord alert = new()
        {
            AlertId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Severity = AlertSeverity.Critical,
            Title = "critical",
            RunId = Guid.NewGuid(),
            Status = AlertStatus.Open,
        };
        AlertRoutingSubscription subscription = new()
        {
            RoutingSubscriptionId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = alert.WorkspaceId,
            ProjectId = alert.ProjectId,
            ChannelType = "email",
            Destination = "ops@example.com",
            MinimumSeverity = AlertSeverity.Warning,
            IsEnabled = true,
        };
        Mock<IAlertRoutingSubscriptionRepository> subscriptions = new();
        subscriptions
            .Setup(s => s.ListEnabledByScopeAsync(tenantId, alert.WorkspaceId, alert.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([subscription]);
        subscriptions.Setup(s => s.UpdateAsync(It.IsAny<AlertRoutingSubscription>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IAlertDeliveryAttemptRepository> attempts = new();
        attempts.Setup(a => a.CreateAsync(It.IsAny<AlertDeliveryAttempt>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        attempts.Setup(a => a.UpdateAsync(It.IsAny<AlertDeliveryAttempt>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IAlertDeliveryChannel> channel = new();
        channel.Setup(c => c.ChannelType).Returns("email");
        channel.Setup(c => c.SendAsync(It.IsAny<AlertDeliveryPayload>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
                new RunDetailDto
                {
                    Run = new RunRecord { RunId = runId },
                    GoldenManifest = new ManifestDocument
                    {
                        RunId = runId,
                        ManifestHash = "sealed-hash",
                    },
                });
        Mock<IManifestHashService> manifestHash = new();
        manifestHash.Setup(m => m.ComputeHash(It.IsAny<ManifestDocument>())).Returns("sealed-hash");
        AlertDeliveryDispatcher sut = new(
            [channel.Object],
            subscriptions.Object,
            attempts.Object,
            audit.Object,
            authority.Object,
            manifestHash.Object);

        await sut.DeliverAsync(alert, CancellationToken.None);

        channel.Verify(c => c.SendAsync(It.IsAny<AlertDeliveryPayload>(), It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertDeliverySucceeded), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DigestDeliveryDispatcher_records_failure_when_channel_missing()
    {
        ArchitectureDigest digest = new()
        {
            DigestId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
        };
        DigestSubscription subscription = new()
        {
            SubscriptionId = Guid.NewGuid(),
            TenantId = digest.TenantId,
            WorkspaceId = digest.WorkspaceId,
            ProjectId = digest.ProjectId,
            ChannelType = "teams",
            Destination = "webhook",
            IsEnabled = true,
        };
        Mock<IDigestSubscriptionRepository> subscriptions = new();
        subscriptions
            .Setup(s => s.ListEnabledByScopeAsync(digest.TenantId, digest.WorkspaceId, digest.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([subscription]);
        Mock<IDigestDeliveryAttemptRepository> attempts = new();
        attempts.Setup(a => a.CreateAsync(It.IsAny<DigestDeliveryAttempt>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        attempts.Setup(a => a.UpdateAsync(It.IsAny<DigestDeliveryAttempt>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        DigestDeliveryDispatcher sut = new([], subscriptions.Object, attempts.Object, audit.Object);

        await sut.DeliverAsync(digest, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DigestDeliveryFailed), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecommendationWorkflowService_persists_plan_and_applies_accept_action()
    {
        Guid recommendationId = Guid.NewGuid();
        Mock<IRecommendationRepository> repository = new();
        repository.Setup(r => r.GetByIdAsync(recommendationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RecommendationRecord
            {
                RecommendationId = recommendationId,
                Status = RecommendationStatus.Proposed,
                Title = "title",
            });
        repository.Setup(r => r.UpsertAsync(It.IsAny<RecommendationRecord>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        RecommendationWorkflowService sut = new(repository.Object);
        ImprovementPlan plan = new()
        {
            RunId = Guid.NewGuid(),
            GeneratedUtc = DateTime.UtcNow,
            Recommendations =
            [
                new ImprovementRecommendation
                {
                    RecommendationId = recommendationId,
                    Title = "Optimize cache",
                    Category = "performance",
                    Rationale = "r",
                    SuggestedAction = "a",
                    Urgency = "Medium",
                    ExpectedImpact = "high",
                    PriorityScore = 80,
                },
            ],
        };
        Guid tenantId = Guid.NewGuid();

        await sut.PersistPlanAsync(plan, tenantId, Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);
        RecommendationRecord? updated = await sut.ApplyActionAsync(
            recommendationId,
            "user-1",
            "User One",
            new RecommendationActionRequest { Action = RecommendationActionType.Accept, Comment = "ok" },
            CancellationToken.None);

        updated.Should().NotBeNull();
        updated!.Status.Should().Be(RecommendationStatus.Accepted);
        repository.Verify(r => r.UpsertAsync(It.IsAny<RecommendationRecord>(), It.IsAny<CancellationToken>()), Times.AtLeast(2));
    }

    [Fact]
    public async Task DelegatingTenantSqlConnectionFactory_forwards_open_connection()
    {
        Mock<ISqlConnectionFactory> inner = new();
        SqlConnection connection = new(
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(
                "Server=(localdb)\\mssqllocaldb;Database=master;Trusted_Connection=True;"));
        inner.Setup(i => i.CreateOpenConnectionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(connection);
        DelegatingTenantSqlConnectionFactory sut = new(inner.Object);

        SqlConnection opened = await sut.CreateOpenConnectionAsync(CancellationToken.None);

        opened.Should().BeSameAs(connection);
    }

    [Fact]
    public void DelegatingTenantSqlConnectionFactory_rejects_null_inner()
    {
        Action act = () => _ = new DelegatingTenantSqlConnectionFactory(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    private static AlertService BuildAlertService(
        Mock<IAlertRuleRepository> ruleRepo,
        Mock<IAlertRecordRepository> alertRepo,
        Mock<IAlertEvaluator> evaluator,
        Mock<IAlertDeliveryDispatcher> dispatcher)
    {
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(g => g.LoadEffectiveContentAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOptions = new();
        integrationOptions.Setup(o => o.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

        return new AlertService(
            ruleRepo.Object,
            alertRepo.Object,
            evaluator.Object,
            dispatcher.Object,
            audit.Object,
            governance.Object,
            Mock.Of<IIntegrationEventPublisher>(),
            Mock.Of<IIntegrationEventOutboxRepository>(),
            integrationOptions.Object,
            NullLogger<AlertService>.Instance);
    }
}

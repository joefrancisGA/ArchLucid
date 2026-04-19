using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Unit tests for <see cref="AlertService.ApplyActionAsync"/>: unknown alert, unknown action,
/// same-status no-op, and the three valid actions (Acknowledge, Resolve, Suppress).
/// </summary>
[Trait("Category", "Unit")]
public sealed class AlertServiceApplyActionTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private static (AlertService Sut,
        Mock<IAlertRecordRepository> Repo,
        Mock<IAuditService> Audit)
        Build(AlertRecord? existingAlert = null)
    {
        Mock<IAlertRuleRepository> ruleRepo = new();
        Mock<IAlertRecordRepository> alertRepo = new();
        Mock<IAlertEvaluator> evaluator = new();
        Mock<IAlertDeliveryDispatcher> dispatcher = new();
        Mock<IAuditService> audit = new();
        Mock<IEffectiveGovernanceLoader> governance = new();
        Mock<IIntegrationEventPublisher> integration = new();

        integration
            .Setup(
                p => p.PublishAsync(
                    It.IsAny<string>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<string?>(),
                    It.IsAny<IReadOnlyDictionary<string, object>?>(),
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        alertRepo
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingAlert);

        alertRepo
            .Setup(x => x.UpdateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        audit
            .Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        outbox
            .Setup(
                o => o.EnqueueAsync(
                    It.IsAny<Guid?>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<IntegrationEventsOptions>> opts = new();
        opts.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

        AlertService sut = new(
            ruleRepo.Object,
            alertRepo.Object,
            evaluator.Object,
            dispatcher.Object,
            audit.Object,
            governance.Object,
            integration.Object,
            outbox.Object,
            opts.Object,
            NullLogger<AlertService>.Instance);

        return (sut, alertRepo, audit);
    }

    private static AlertRecord OpenAlert(Guid alertId) => new()
    {
        AlertId = alertId,
        Status = AlertStatus.Open,
        Title = "test alert",
        Severity = AlertSeverity.Warning,
        DeduplicationKey = "test:key"
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Unknown alertId → null
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyActionAsync_UnknownAlertId_ReturnsNull()
    {
        (AlertService sut, Mock<IAlertRecordRepository> repo, _) = Build(existingAlert: null);

        AlertRecord? result = await sut.ApplyActionAsync(
            Guid.NewGuid(), "user1", "User One",
            new AlertActionRequest { Action = AlertActionType.Acknowledge },
            CancellationToken.None);

        result.Should().BeNull();
        repo.Verify(x => x.UpdateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Unknown action → no-op, returns existing record unchanged
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyActionAsync_UnknownAction_ReturnsUnchangedRecord()
    {
        Guid alertId = Guid.NewGuid();
        AlertRecord alert = OpenAlert(alertId);
        (AlertService sut, Mock<IAlertRecordRepository> repo, Mock<IAuditService> audit) = Build(alert);

        AlertRecord? result = await sut.ApplyActionAsync(
            alertId, "user1", "User One",
            new AlertActionRequest { Action = "DeleteIt" },
            CancellationToken.None);

        result.Should().NotBeNull();
        result.Status.Should().Be(AlertStatus.Open, "status must not change for an unknown action");
        repo.Verify(x => x.UpdateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Never);
        audit.Verify(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Same status → no-op
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyActionAsync_SameStatus_NoUpdateOrAudit()
    {
        Guid alertId = Guid.NewGuid();
        AlertRecord alert = OpenAlert(alertId);
        alert.Status = AlertStatus.Acknowledged;
        (AlertService sut, Mock<IAlertRecordRepository> repo, Mock<IAuditService> audit) = Build(alert);

        AlertRecord? result = await sut.ApplyActionAsync(
            alertId, "user1", "User One",
            new AlertActionRequest { Action = AlertActionType.Acknowledge },
            CancellationToken.None);

        result.Should().NotBeNull();
        result.Status.Should().Be(AlertStatus.Acknowledged);
        repo.Verify(x => x.UpdateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Never);
        audit.Verify(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Acknowledge
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyActionAsync_Acknowledge_UpdatesStatusAndAudits()
    {
        Guid alertId = Guid.NewGuid();
        (AlertService sut, Mock<IAlertRecordRepository> repo, Mock<IAuditService> audit) = Build(OpenAlert(alertId));

        AlertRecord? result = await sut.ApplyActionAsync(
            alertId, "user1", "User One",
            new AlertActionRequest { Action = AlertActionType.Acknowledge, Comment = "noted" },
            CancellationToken.None);

        result!.Status.Should().Be(AlertStatus.Acknowledged);
        repo.Verify(x => x.UpdateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertAcknowledged),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Resolve
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyActionAsync_Resolve_UpdatesStatusAndAudits()
    {
        Guid alertId = Guid.NewGuid();
        (AlertService sut, Mock<IAlertRecordRepository> repo, Mock<IAuditService> audit) = Build(OpenAlert(alertId));

        AlertRecord? result = await sut.ApplyActionAsync(
            alertId, "user1", "User One",
            new AlertActionRequest { Action = AlertActionType.Resolve },
            CancellationToken.None);

        result!.Status.Should().Be(AlertStatus.Resolved);
        repo.Verify(x => x.UpdateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertResolved),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Suppress
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyActionAsync_Suppress_UpdatesStatusAndAudits()
    {
        Guid alertId = Guid.NewGuid();
        (AlertService sut, Mock<IAlertRecordRepository> repo, Mock<IAuditService> audit) = Build(OpenAlert(alertId));

        AlertRecord? result = await sut.ApplyActionAsync(
            alertId, "user1", "User One",
            new AlertActionRequest { Action = AlertActionType.Suppress },
            CancellationToken.None);

        result!.Status.Should().Be(AlertStatus.Suppressed);
        repo.Verify(x => x.UpdateAsync(It.IsAny<AlertRecord>(), It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertSuppressed),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}

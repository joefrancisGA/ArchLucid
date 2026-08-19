using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Alerts;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatch6Tests
{
    [Fact]
    public async Task NoOpAdminNotificationsRepository_completes_without_persisting()
    {
        NoOpAdminNotificationsRepository sut = new();

        await sut.Invoking(
                r => r.InsertAsync("kind", "summary", """{"ok":true}""", CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task InMemoryAdvisoryScanExecutionRepository_round_trips_executions()
    {
        InMemoryAdvisoryScanExecutionRepository sut = new();
        Guid scheduleId = Guid.NewGuid();
        AdvisoryScanExecution first = new()
        {
            ExecutionId = Guid.NewGuid(),
            ScheduleId = scheduleId,
            StartedUtc = DateTime.UtcNow.AddMinutes(-5),
        };
        AdvisoryScanExecution second = new()
        {
            ExecutionId = Guid.NewGuid(),
            ScheduleId = scheduleId,
            StartedUtc = DateTime.UtcNow,
        };

        await sut.CreateAsync(first, CancellationToken.None);
        await sut.CreateAsync(second, CancellationToken.None);

        IReadOnlyList<AdvisoryScanExecution> listed =
            await sut.ListByScheduleAsync(scheduleId, take: 10, CancellationToken.None);

        listed.Should().HaveCount(2);
        listed[0].ExecutionId.Should().Be(second.ExecutionId);

        first.Status = "Completed";
        await sut.UpdateAsync(first, CancellationToken.None);

        listed = await sut.ListByScheduleAsync(scheduleId, take: 10, CancellationToken.None);
        listed.Single(x => x.ExecutionId == first.ExecutionId).Status.Should().Be("Completed");
    }

    [Fact]
    public async Task RecommendationFeedbackAnalyzer_aggregates_status_counts_by_category()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        Mock<IRecommendationRepository> repository = new();
        repository
            .Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, null, 1000, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RecommendationRecord { Category = "cost", Status = "Open" },
                new RecommendationRecord { Category = "cost", Status = "Open" },
                new RecommendationRecord { Category = "security", Status = "Closed" },
            ]);

        RecommendationFeedbackAnalyzer sut = new(repository.Object);

        IReadOnlyDictionary<string, int> counts =
            await sut.GetStatusCountsByCategoryAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        counts.Should().ContainKey("cost:Open").WhoseValue.Should().Be(2);
        counts.Should().ContainKey("security:Closed").WhoseValue.Should().Be(1);
    }

    [Fact]
    public async Task AlertSuppressionPolicy_allows_new_alert_when_no_existing_row()
    {
        Mock<IAlertRecordRepository> alerts = new();
        alerts
            .Setup(r => r.GetOpenByDeduplicationKeyAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((AlertRecord?)null);

        AlertSuppressionPolicy sut = new(alerts.Object);
        CompositeAlertRule rule = new()
        {
            CompositeRuleId = Guid.NewGuid(),
            Name = "rule-1",
            CooldownMinutes = 5,
            SuppressionWindowMinutes = 60,
        };
        AlertEvaluationContext context = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeTrue();
        decision.WasSuppressed.Should().BeFalse();
        decision.DeduplicationKey.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task AlertSuppressionPolicy_suppresses_within_cooldown_window()
    {
        Mock<IAlertRecordRepository> alerts = new();
        alerts
            .Setup(r => r.GetOpenByDeduplicationKeyAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertRecord { CreatedUtc = DateTime.UtcNow });

        AlertSuppressionPolicy sut = new(alerts.Object);
        CompositeAlertRule rule = new()
        {
            CompositeRuleId = Guid.NewGuid(),
            Name = "rule-2",
            CooldownMinutes = 60,
            SuppressionWindowMinutes = 120,
        };
        AlertEvaluationContext context = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        AlertSuppressionDecision decision = await sut.DecideAsync(
            rule,
            context,
            new AlertMetricSnapshot(),
            CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeFalse();
        decision.WasSuppressed.Should().BeTrue();
        decision.Reason.Should().Contain("cooldown");
    }
}

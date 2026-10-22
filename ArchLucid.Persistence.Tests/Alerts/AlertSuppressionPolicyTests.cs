using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Alerts;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class AlertSuppressionPolicyTests
{
    private readonly Guid _tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private readonly Guid _projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private readonly Guid _ruleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private readonly Guid _runId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    [Fact]
    public async Task DecideAsync_creates_alert_when_no_open_record_exists()
    {
        Mock<IAlertRecordRepository> repository = new();
        repository
            .Setup(r => r.GetOpenByDeduplicationKeyAsync(
                _tenantId,
                _workspaceId,
                _projectId,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((AlertRecord?)null);

        AlertSuppressionPolicy sut = new(repository.Object);
        CompositeAlertRule rule = BuildRule(cooldownMinutes: 60, suppressionWindowMinutes: 1440);
        AlertEvaluationContext context = BuildContext();
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeTrue();
        decision.WasSuppressed.Should().BeFalse();
        decision.DeduplicationKey.Should().Contain(_ruleId.ToString());
    }

    [Fact]
    public async Task DecideAsync_suppresses_within_cooldown_window()
    {
        Mock<IAlertRecordRepository> repository = new();
        repository
            .Setup(r => r.GetOpenByDeduplicationKeyAsync(
                _tenantId,
                _workspaceId,
                _projectId,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertRecord
            {
                CreatedUtc = DateTime.UtcNow.AddMinutes(-5),
                DeduplicationKey = "composite:test",
            });

        AlertSuppressionPolicy sut = new(repository.Object);
        CompositeAlertRule rule = BuildRule(cooldownMinutes: 60, suppressionWindowMinutes: 1440);
        AlertEvaluationContext context = BuildContext();
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeFalse();
        decision.WasSuppressed.Should().BeTrue();
        decision.Reason.Should().Contain("cooldown");
    }

    [Fact]
    public async Task DecideAsync_suppresses_within_suppression_window_after_cooldown()
    {
        Mock<IAlertRecordRepository> repository = new();
        repository
            .Setup(r => r.GetOpenByDeduplicationKeyAsync(
                _tenantId,
                _workspaceId,
                _projectId,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertRecord
            {
                CreatedUtc = DateTime.UtcNow.AddMinutes(-90),
                DeduplicationKey = "composite:test",
            });

        AlertSuppressionPolicy sut = new(repository.Object);
        CompositeAlertRule rule = BuildRule(cooldownMinutes: 60, suppressionWindowMinutes: 1440);
        AlertEvaluationContext context = BuildContext();
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeFalse();
        decision.WasSuppressed.Should().BeTrue();
        decision.Reason.Should().Contain("suppression window");
    }

    [Fact]
    public async Task DecideAsync_suppresses_when_prior_open_alert_outlived_windows()
    {
        Mock<IAlertRecordRepository> repository = new();
        repository
            .Setup(r => r.GetOpenByDeduplicationKeyAsync(
                _tenantId,
                _workspaceId,
                _projectId,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertRecord
            {
                CreatedUtc = DateTime.UtcNow.AddDays(-3),
                DeduplicationKey = "composite:test",
            });

        AlertSuppressionPolicy sut = new(repository.Object);
        CompositeAlertRule rule = BuildRule(cooldownMinutes: 60, suppressionWindowMinutes: 1440);
        AlertEvaluationContext context = BuildContext();
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeFalse();
        decision.WasSuppressed.Should().BeTrue();
        decision.Reason.Should().Contain("prior open or acknowledged alert still exists");
    }

    private CompositeAlertRule BuildRule(int cooldownMinutes, int suppressionWindowMinutes) =>
        new()
        {
            CompositeRuleId = _ruleId,
            TenantId = _tenantId,
            WorkspaceId = _workspaceId,
            ProjectId = _projectId,
            Name = "test-rule",
            CooldownMinutes = cooldownMinutes,
            SuppressionWindowMinutes = suppressionWindowMinutes,
            DedupeScope = CompositeDedupeScope.RuleAndRun,
        };

    private AlertEvaluationContext BuildContext() =>
        new()
        {
            TenantId = _tenantId,
            WorkspaceId = _workspaceId,
            ProjectId = _projectId,
            RunId = _runId,
        };
}

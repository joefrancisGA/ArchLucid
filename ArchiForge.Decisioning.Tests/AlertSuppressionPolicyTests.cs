using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;

using ArchiForge.Persistence.Alerts;

using FluentAssertions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class AlertSuppressionPolicyTests
{
    [Fact]
    public async Task DecideAsync_WhenNoExistingOpenAlert_AllowsCreation()
    {
        Mock<IAlertRecordRepository> repo = new();
        repo
            .Setup(
                x => x.GetOpenByDeduplicationKeyAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync((AlertRecord?)null);

        AlertSuppressionPolicy sut = new(repo.Object);
        CompositeAlertRule rule = CreateRule(CompositeDedupeScope.RuleOnly);
        AlertEvaluationContext context = CreateContext();
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeTrue();
        decision.DeduplicationKey.Should().Be($"composite:{rule.CompositeRuleId}");
    }

    [Fact]
    public async Task DecideAsync_WhenWithinCooldown_Suppresses()
    {
        Mock<IAlertRecordRepository> repo = new();
        repo
            .Setup(
                x => x.GetOpenByDeduplicationKeyAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new AlertRecord
                {
                    CreatedUtc = DateTime.UtcNow,
                });

        AlertSuppressionPolicy sut = new(repo.Object);
        CompositeAlertRule rule = CreateRule(CompositeDedupeScope.RuleOnly);
        rule.CooldownMinutes = 120;
        AlertEvaluationContext context = CreateContext();
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeFalse();
        decision.Reason.Should().Contain("cooldown");
    }

    [Fact]
    public async Task DecideAsync_WhenPastCooldownButInsideSuppressionWindow_Suppresses()
    {
        Mock<IAlertRecordRepository> repo = new();
        repo
            .Setup(
                x => x.GetOpenByDeduplicationKeyAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new AlertRecord
                {
                    CreatedUtc = DateTime.UtcNow.AddMinutes(-10),
                });

        AlertSuppressionPolicy sut = new(repo.Object);
        CompositeAlertRule rule = CreateRule(CompositeDedupeScope.RuleOnly);
        rule.CooldownMinutes = 1;
        rule.SuppressionWindowMinutes = 60;
        AlertEvaluationContext context = CreateContext();
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.ShouldCreateAlert.Should().BeFalse();
        decision.Reason.Should().Contain("suppression window");
    }

    [Fact]
    public async Task DecideAsync_RuleAndRun_IncludesRunIdInKey()
    {
        Mock<IAlertRecordRepository> repo = new();
        repo
            .Setup(
                x => x.GetOpenByDeduplicationKeyAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync((AlertRecord?)null);

        Guid runId = Guid.NewGuid();
        AlertSuppressionPolicy sut = new(repo.Object);
        CompositeAlertRule rule = CreateRule(CompositeDedupeScope.RuleAndRun);
        AlertEvaluationContext context = CreateContext(runId);
        AlertMetricSnapshot snapshot = new();

        AlertSuppressionDecision decision = await sut.DecideAsync(rule, context, snapshot, CancellationToken.None);

        decision.DeduplicationKey.Should().Be($"composite:{rule.CompositeRuleId}:run:{runId}");
    }

    private static CompositeAlertRule CreateRule(string dedupeScope) =>
        new()
        {
            CompositeRuleId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Name = "n",
            DedupeScope = dedupeScope,
            CooldownMinutes = 0,
            SuppressionWindowMinutes = 0,
            Conditions = [],
        };

    private static AlertEvaluationContext CreateContext(Guid? runId = null) =>
        new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = runId ?? Guid.NewGuid(),
        };
}

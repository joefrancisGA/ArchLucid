using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;
using ArchiForge.Decisioning.Alerts.Simulation;

using ArchiForge.Persistence.Alerts.Simulation;

using FluentAssertions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class RuleSimulationServiceTests
{
    [Fact]
    public async Task SimulateAsync_WhenUseHistoricalWindowFalseAndNoRunId_ReturnsZeroEvaluationsWithNote()
    {
        RuleSimulationService sut = CreateSut(
            Mock.Of<IAlertEvaluator>(),
            Mock.Of<IAlertMetricSnapshotBuilder>(),
            Mock.Of<ICompositeAlertRuleEvaluator>(),
            Mock.Of<IAlertSuppressionPolicy>(),
            Mock.Of<IAlertSimulationContextProvider>());

        RuleSimulationRequest request = new()
        {
            RuleKind = RuleKindConstants.Simple,
            SimpleRule = new AlertRule { Name = "r" },
            UseHistoricalWindow = false,
            RunId = null,
        };

        RuleSimulationResult result = await sut.SimulateAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), request, CancellationToken.None);

        result.EvaluatedRunCount.Should().Be(0);
        result.SummaryNotes.Should().ContainSingle(n => n.Contains("UseHistoricalWindow", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task SimulateAsync_WhenNoContexts_AddsNoRunsNote()
    {
        Mock<IAlertSimulationContextProvider> provider = new();
        provider
            .Setup(
                x => x.GetContextsAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RuleSimulationService sut = CreateSut(
            Mock.Of<IAlertEvaluator>(),
            Mock.Of<IAlertMetricSnapshotBuilder>(),
            Mock.Of<ICompositeAlertRuleEvaluator>(),
            Mock.Of<IAlertSuppressionPolicy>(),
            provider.Object);

        RuleSimulationRequest request = new()
        {
            RuleKind = RuleKindConstants.Simple,
            SimpleRule = new AlertRule { Name = "r" },
            RecentRunCount = 3,
        };

        RuleSimulationResult result = await sut.SimulateAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), request, CancellationToken.None);

        result.EvaluatedRunCount.Should().Be(0);
        result.SummaryNotes.Should().Contain(n => n.Contains("No evaluation contexts", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task SimulateAsync_SimpleRule_WhenEvaluatorReturnsAlerts_AddsMatchedOutcomes()
    {
        Guid runId = Guid.NewGuid();
        AlertEvaluationContext context = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = runId,
        };

        Mock<IAlertSimulationContextProvider> provider = new();
        provider
            .Setup(
                x => x.GetContextsAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync([context]);

        AlertRule template = new()
        {
            Name = "Cost spike",
            Severity = AlertSeverity.Warning,
            TenantId = context.TenantId,
            WorkspaceId = context.WorkspaceId,
            ProjectId = context.ProjectId,
        };

        AlertRecord generated = new()
        {
            Title = "Fired",
            Severity = AlertSeverity.Critical,
            Description = "d",
            DeduplicationKey = "k1",
        };

        Mock<IAlertEvaluator> evaluator = new();
        evaluator
            .Setup(x => x.Evaluate(It.IsAny<IReadOnlyList<AlertRule>>(), It.IsAny<AlertEvaluationContext>()))
            .Returns([generated]);

        RuleSimulationService sut = CreateSut(
            evaluator.Object,
            Mock.Of<IAlertMetricSnapshotBuilder>(),
            Mock.Of<ICompositeAlertRuleEvaluator>(),
            Mock.Of<IAlertSuppressionPolicy>(),
            provider.Object);

        RuleSimulationRequest request = new()
        {
            RuleKind = RuleKindConstants.Simple,
            SimpleRule = template,
            RecentRunCount = 1,
        };

        RuleSimulationResult result = await sut.SimulateAsync(context.TenantId, context.WorkspaceId, context.ProjectId, request, CancellationToken.None);

        result.MatchedCount.Should().Be(1);
        result.Outcomes.Should().ContainSingle(o => o.RuleMatched && o.WouldCreateAlert && o.Title == "Fired");
    }

    [Fact]
    public async Task SimulateAsync_CompositeRule_WhenMatched_UsesSuppressionPolicyDecision()
    {
        Guid runId = Guid.NewGuid();
        AlertEvaluationContext context = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = runId,
        };

        Mock<IAlertSimulationContextProvider> provider = new();
        provider
            .Setup(
                x => x.GetContextsAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync([context]);

        CompositeAlertRule compositeTemplate = new()
        {
            Name = "Composite",
            Severity = AlertSeverity.Warning,
            TenantId = context.TenantId,
            WorkspaceId = context.WorkspaceId,
            ProjectId = context.ProjectId,
            Conditions = [],
        };

        AlertMetricSnapshot snapshot = new();

        Mock<IAlertMetricSnapshotBuilder> metrics = new();
        metrics.Setup(x => x.Build(context)).Returns(snapshot);

        Mock<ICompositeAlertRuleEvaluator> compositeEval = new();
        compositeEval.Setup(x => x.Evaluate(It.IsAny<CompositeAlertRule>(), snapshot)).Returns(true);

        Mock<IAlertSuppressionPolicy> suppression = new();
        suppression
            .Setup(x => x.DecideAsync(It.IsAny<CompositeAlertRule>(), context, snapshot, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new AlertSuppressionDecision
                {
                    ShouldCreateAlert = false,
                    Reason = "deduped",
                    DeduplicationKey = "dk",
                });

        RuleSimulationService sut = CreateSut(
            Mock.Of<IAlertEvaluator>(),
            metrics.Object,
            compositeEval.Object,
            suppression.Object,
            provider.Object);

        RuleSimulationRequest request = new()
        {
            RuleKind = RuleKindConstants.Composite,
            CompositeRule = compositeTemplate,
            RecentRunCount = 1,
        };

        RuleSimulationResult result = await sut.SimulateAsync(context.TenantId, context.WorkspaceId, context.ProjectId, request, CancellationToken.None);

        result.WouldSuppressCount.Should().Be(1);
        result.Outcomes.Should().ContainSingle(o => o.RuleMatched && !o.WouldCreateAlert && o.SuppressionReason == "deduped");
    }

    private static RuleSimulationService CreateSut(
        IAlertEvaluator alertEvaluator,
        IAlertMetricSnapshotBuilder metricSnapshotBuilder,
        ICompositeAlertRuleEvaluator compositeEvaluator,
        IAlertSuppressionPolicy suppressionPolicy,
        IAlertSimulationContextProvider contextProvider) =>
        new(alertEvaluator, metricSnapshotBuilder, compositeEvaluator, suppressionPolicy, contextProvider);
}

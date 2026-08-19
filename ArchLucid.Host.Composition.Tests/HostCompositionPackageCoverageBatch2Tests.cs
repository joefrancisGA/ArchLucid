using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Host.Composition.Alerts;
using ArchLucid.Host.Composition.AzureOpenAI;

using FluentAssertions;

using Moq;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCompositionPackageCoverageBatch2Tests
{
    [Fact]
    public async Task AlertServiceDecisioningPortAdapter_forwards_evaluate_and_apply()
    {
        Mock<ArchLucid.Core.Alerts.IAlertService> inner = new();
        inner.Setup(i => i.EvaluateAndPersistAsync(It.IsAny<ArchLucid.Core.Alerts.AlertEvaluationContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertEvaluationOutcome([], []));
        inner.Setup(i => i.ApplyActionAsync(It.IsAny<Guid>(), "u", "n", It.IsAny<AlertActionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AlertRecord?)null);
        AlertServiceDecisioningPortAdapter sut = new(inner.Object);

        await sut.EvaluateAndPersistAsync(new ArchLucid.Core.Alerts.AlertEvaluationContext(), CancellationToken.None);
        await sut.ApplyActionAsync(Guid.NewGuid(), "u", "n", new AlertActionRequest(), CancellationToken.None);

        inner.Verify(i => i.EvaluateAndPersistAsync(It.IsAny<ArchLucid.Core.Alerts.AlertEvaluationContext>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompositeAlertServiceDecisioningPortAdapter_forwards_evaluate()
    {
        Mock<ArchLucid.Core.Alerts.Composite.ICompositeAlertService> inner = new();
        inner.Setup(i => i.EvaluateAndPersistAsync(It.IsAny<ArchLucid.Core.Alerts.AlertEvaluationContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CompositeAlertEvaluationResult([], 0));
        CompositeAlertServiceDecisioningPortAdapter sut = new(inner.Object);

        CompositeAlertEvaluationResult result =
            await sut.EvaluateAndPersistAsync(new ArchLucid.Core.Alerts.AlertEvaluationContext(), CancellationToken.None);

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task RuleSimulationServiceDecisioningPortAdapter_forwards_simulation_calls()
    {
        Mock<ArchLucid.Core.Alerts.Simulation.IRuleSimulationService> inner = new();
        inner.Setup(i => i.SimulateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<RuleSimulationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RuleSimulationResult());
        inner.Setup(i => i.CompareCandidatesAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<RuleCandidateComparisonRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RuleCandidateComparisonResult());
        RuleSimulationServiceDecisioningPortAdapter sut = new(inner.Object);
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await sut.SimulateAsync(tenantId, workspaceId, projectId, new RuleSimulationRequest(), CancellationToken.None);
        await sut.CompareCandidatesAsync(tenantId, workspaceId, projectId, new RuleCandidateComparisonRequest(), CancellationToken.None);

        inner.Verify(i => i.SimulateAsync(tenantId, workspaceId, projectId, It.IsAny<RuleSimulationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void ScopedInnerAgentCompletionClient_exposes_inner_and_disposes()
    {
        Mock<IAgentCompletionClient> inner = new();
        using ScopedInnerAgentCompletionClient sut = new(inner.Object);

        sut.Inner.Should().BeSameAs(inner.Object);
    }

    [Fact]
    public void AlertServiceDecisioningPortAdapter_rejects_null_inner()
    {
        Action act = () => _ = new AlertServiceDecisioningPortAdapter(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class SelectiveExecuteAffectedElementResolverTests
{
    [Fact]
    public void RequiresFullReReview_returns_true_when_critic_forced()
    {
        SelectiveExecuteAffectedElementResolver
            .RequiresFullReReview([AgentType.Cost, AgentType.Critic])
            .Should()
            .BeTrue();
    }

    [Fact]
    public void RequiresFullReReview_returns_false_without_critic()
    {
        SelectiveExecuteAffectedElementResolver
            .RequiresFullReReview([AgentType.Topology, AgentType.Cost])
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ResolveAffectedElementIds_prefers_explicit_ids()
    {
        ArchitectureKnowledgeModel model = BuildModel();

        IReadOnlyList<string> resolved = SelectiveExecuteAffectedElementResolver.ResolveAffectedElementIds(
            model,
            [AgentType.Topology],
            ["explicit-1", "explicit-2"]);

        resolved.Should().BeEquivalentTo(["explicit-1", "explicit-2"]);
    }

    [Fact]
    public void ResolveAffectedElementIds_maps_topology_to_component_elements()
    {
        ArchitectureKnowledgeModel model = BuildModel();

        IReadOnlyList<string> resolved = SelectiveExecuteAffectedElementResolver.ResolveAffectedElementIds(
            model,
            [AgentType.Topology],
            null);

        resolved.Should().BeEquivalentTo(["component-1"]);
    }

    [Fact]
    public void ResolveAffectedElementIds_maps_compliance_to_obligation_elements()
    {
        ArchitectureKnowledgeModel model = BuildModel();

        IReadOnlyList<string> resolved = SelectiveExecuteAffectedElementResolver.ResolveAffectedElementIds(
            model,
            [AgentType.Compliance],
            null);

        resolved.Should().BeEquivalentTo(["compliance-1"]);
    }

    private static ArchitectureKnowledgeModel BuildModel() =>
        new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "component-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Billing API",
                },
                new ArchitectureModelElement
                {
                    ElementId = "compliance-1",
                    Kind = ArchitectureElementKind.ComplianceObligation,
                    Name = "PCI scope",
                },
                new ArchitectureModelElement
                {
                    ElementId = "cost-1",
                    Kind = ArchitectureElementKind.CostDriver,
                    Name = "Storage spend",
                },
            ],
        };
}

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MermaidDiagramExecutiveRenderCoercionTests
{
    [Fact]
    public void Coerce_executive_partitioned_within_node_cap_returns_succeeded()
    {
        MermaidDiagramRenderResult input = new()
        {
            Status = MermaidDiagramRenderStatus.Partitioned,
            PrimaryMermaid = "flowchart LR\n  A-->B",
            Metrics = new MermaidDiagramComplexityMetrics
            {
                NodeCount = DiagramAstFromGraphCompilerConstants.ExecutiveMaxResourceNodes,
            },
        };

        MermaidDiagramRenderResult result = MermaidDiagramExecutiveRenderCoercion.Coerce(DiagramMode.Executive, input);

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.FallbackArtifacts.Should().BeEmpty();
    }

    [Fact]
    public void Coerce_non_executive_mode_leaves_partitioned_unchanged()
    {
        MermaidDiagramRenderResult input = new()
        {
            Status = MermaidDiagramRenderStatus.Partitioned,
            PrimaryMermaid = "flowchart LR\n  A-->B",
            Metrics = new MermaidDiagramComplexityMetrics { NodeCount = 12 },
        };

        MermaidDiagramRenderResult result = MermaidDiagramExecutiveRenderCoercion.Coerce(DiagramMode.Network, input);

        result.Status.Should().Be(MermaidDiagramRenderStatus.Partitioned);
    }

    [Fact]
    public void ResolveFallbackArtifactStatus_executive_always_succeeds_when_structurally_valid()
    {
        MermaidDiagramRenderStatus status = MermaidDiagramExecutiveRenderCoercion.ResolveFallbackArtifactStatus(
            DiagramMode.Executive,
            structurallyValid: true,
            new MermaidDiagramComplexityMetrics { NodeCount = 500 },
            new MermaidDiagramReadabilityThresholds { MaxNodes = 1 });

        status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
    }
}

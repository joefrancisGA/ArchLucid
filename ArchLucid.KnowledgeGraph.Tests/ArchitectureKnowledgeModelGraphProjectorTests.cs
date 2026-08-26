using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Projection;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureKnowledgeModelGraphProjectorTests
{
  [Fact]
  public void Project_maps_structural_elements_to_graph_nodes()
  {
    ArchitectureKnowledgeModel model = new()
    {
      ModelId = "model-1",
      TenantId = Guid.NewGuid().ToString("D"),
      RunId = Guid.NewGuid().ToString("D"),
      Elements =
      [
        new ArchitectureModelElement
        {
          ElementId = "comp-1",
          Kind = ArchitectureElementKind.Component,
          Name = "API Gateway",
          Description = "Ingress",
          RelatedElementIds = ["trust-1"],
        },
        new ArchitectureModelElement
        {
          ElementId = "trust-1",
          Kind = ArchitectureElementKind.TrustBoundary,
          Name = "Public edge",
        },
      ],
    };

    ContextSnapshot context = new()
    {
      SnapshotId = Guid.NewGuid(),
      RunId = Guid.NewGuid(),
      ProjectId = "project",
      CreatedUtc = TimeProvider.System.UtcNowDateTime(),
    };

    ArchitectureKnowledgeModelGraphProjector projector = new();
    GraphSnapshot snapshot = projector.Project(model, context, context.RunId);

    snapshot.Nodes.Should().HaveCount(2);
    snapshot.Nodes.Should().Contain(node => node.NodeId == "akm:comp-1" && node.Label == "API Gateway");
    snapshot.Nodes.Should().Contain(node => node.NodeId == "akm:trust-1");
    snapshot.Edges.Should().ContainSingle(edge =>
      edge.FromNodeId == "akm:comp-1" && edge.ToNodeId == "akm:trust-1");
    snapshot.Warnings.Should().Contain(warning =>
      warning.Contains("ArchitectureKnowledgeModel", StringComparison.Ordinal));
  }
}

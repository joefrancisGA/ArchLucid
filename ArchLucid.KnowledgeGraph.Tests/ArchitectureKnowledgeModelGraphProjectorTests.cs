using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Projection;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
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

  [Fact]
  public void Project_retains_relates_edge_when_related_element_id_differs_only_by_case()
  {
    ArchitectureKnowledgeModel model = new()
    {
      ModelId = "model-case",
      TenantId = Guid.NewGuid().ToString("D"),
      RunId = Guid.NewGuid().ToString("D"),
      Elements =
      [
        new ArchitectureModelElement
        {
          ElementId = "trust-1",
          Kind = ArchitectureElementKind.TrustBoundary,
          Name = "Public edge",
        },
        new ArchitectureModelElement
        {
          ElementId = "comp-1",
          Kind = ArchitectureElementKind.Component,
          Name = "API Gateway",
          RelatedElementIds = ["TRUST-1"],
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
    snapshot.Edges.Should().ContainSingle(edge =>
      edge.FromNodeId == "akm:comp-1"
      && edge.ToNodeId == "akm:trust-1"
      && edge.EdgeType == GraphEdgeTypes.RelatesTo);
  }

  [Fact]
  public void Project_deduplicates_structural_elements_when_element_id_differs_only_by_case()
  {
    ArchitectureKnowledgeModel model = new()
    {
      ModelId = "model-dedup",
      TenantId = Guid.NewGuid().ToString("D"),
      RunId = Guid.NewGuid().ToString("D"),
      Elements =
      [
        new ArchitectureModelElement
        {
          ElementId = "comp-1",
          Kind = ArchitectureElementKind.Component,
          Name = "First casing",
        },
        new ArchitectureModelElement
        {
          ElementId = "COMP-1",
          Kind = ArchitectureElementKind.Component,
          Name = "Second casing",
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

    snapshot.Nodes.Should().ContainSingle(node => node.NodeId == "akm:comp-1");
  }
}

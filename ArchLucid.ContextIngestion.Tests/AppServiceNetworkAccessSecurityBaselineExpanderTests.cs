using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Mapping;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class AppServiceNetworkAccessSecurityBaselineExpanderTests
{
    [Fact]
    public void Expand_open_internet_rule_creates_security_baseline_linked_to_app_service()
    {
        CanonicalObject appService = new()
        {
            ObjectType = "TopologyResource",
            Name = "web-app",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["resourceType"] = "Microsoft.Web/sites",
                ["ipSecurityRestrictions"] =
                    """[{"name":"AllowAll","ipAddress":"0.0.0.0/0","action":"Allow"}]""",
            },
        };

        IReadOnlyList<CanonicalObject> expanded = AppServiceNetworkAccessSecurityBaselineExpander.Expand([appService]);

        expanded.Should().HaveCountGreaterThan(1);

        CanonicalObject? baseline = expanded.FirstOrDefault(o =>
            o.ObjectType == "SecurityBaseline"
            && o.Properties.TryGetValue("ruleKind", out string? kind)
            && kind == "OpenPublicEndpoint");

        baseline.Should().NotBeNull();
        baseline!.Properties["status"].Should().Be("missing");
        baseline.Properties["protectedTopologyNodeIds"].Should().Be($"obj-{appService.ObjectId}");

        GraphNodeFactory factory = new();
        List<GraphNode> nodes = expanded.Select(factory.CreateNode).ToList();

        DefaultGraphEdgeInferer inferer = new();
        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString(),
            CanonicalObjects = expanded.ToList(),
        };

        IReadOnlyList<GraphEdge> edges = inferer.InferEdges(snapshot, nodes);

        edges.Should().Contain(e =>
            e.EdgeType == "PROTECTS"
            && e.FromNodeId == $"obj-{baseline.ObjectId}"
            && e.ToNodeId == $"obj-{appService.ObjectId}");
    }
}

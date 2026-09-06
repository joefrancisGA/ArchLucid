using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class ActorSecurityFindingEngineTests
{
    [Fact]
    public async Task ExternalExposureFindingEngine_skips_declaration_ingress_actor_with_trust_boundary()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-111111111111");
        GraphNode ingress = new()
        {
            NodeId = "obj-ingress-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "payments/public",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-ingress",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["k8s.kind"] = "ingress",
                ["k8s.name"] = "public",
            },
        };

        IReadOnlyList<GraphNode> materialized =
            ArchLucid.KnowledgeGraph.Materialization.DeclarationIdentityActorMaterializer.MaterializeFromNodes(
                [ingress],
                snapshotId);

        GraphSnapshot snapshot = new()
        {
            Nodes = [ingress, .. materialized],
        };

        ExternalExposureFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task TrustBoundaryFindingEngine_fires_for_mixed_declaration_and_internal_actors()
    {
        Guid snapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        GraphNode functionApp = new()
        {
            NodeId = "obj-func-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "payments-func",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-func",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_linux_function_app",
                ["tf.identity_type"] = "SystemAssigned",
            },
        };

        GraphNode ingress = new()
        {
            NodeId = "obj-ingress-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "public-ingress",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-ingress",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["k8s.kind"] = "ingress",
                ["k8s.name"] = "public-ingress",
            },
        };

        IReadOnlyList<GraphNode> materialized =
            ArchLucid.KnowledgeGraph.Materialization.DeclarationIdentityActorMaterializer.MaterializeFromNodes(
                [functionApp, ingress],
                snapshotId);

        GraphSnapshot snapshot = new()
        {
            Nodes = [functionApp, ingress, .. materialized],
        };

        TrustBoundaryFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task ExternalExposureFindingEngine_fires_when_external_actor_lacks_trust_boundary()
    {
        GraphSnapshot snapshot = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "actor-1",
                    NodeType = GraphNodeTypes.Actor,
                    Label = "Anonymous user",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["trustOrigin"] = "PublicAnonymous",
                        ["kind"] = "Human",
                    },
                },
            ],
        };

        ExternalExposureFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("external-exposure");
    }

    [Fact]
    public async Task TrustBoundaryFindingEngine_fires_for_mixed_origins_without_boundaries()
    {
        GraphSnapshot snapshot = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "actor-internal",
                    NodeType = GraphNodeTypes.Actor,
                    Label = "Employee",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["trustOrigin"] = "Internal",
                        ["kind"] = "Human",
                    },
                },
                new GraphNode
                {
                    NodeId = "actor-external",
                    NodeType = GraphNodeTypes.Actor,
                    Label = "Customer",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["trustOrigin"] = "External",
                        ["kind"] = "Human",
                    },
                },
            ],
        };

        TrustBoundaryFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("trust-boundary");
    }

    [Fact]
    public async Task PrivilegedAccessFindingEngine_fires_for_internal_human_actor()
    {
        GraphSnapshot snapshot = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "actor-internal",
                    NodeType = GraphNodeTypes.Actor,
                    Label = "Admin",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["trustOrigin"] = "Internal",
                        ["kind"] = "Human",
                    },
                },
            ],
        };

        PrivilegedAccessFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("privileged-access");
    }
}

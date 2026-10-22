using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
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

        ExternalExposureFindingEngine sut = new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));

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

        TrustBoundaryFindingEngine sut = new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));

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

        ExternalExposureFindingEngine sut = new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));

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

        TrustBoundaryFindingEngine sut = new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));

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

        PrivilegedAccessFindingEngine sut = new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("privileged-access");
    }

    [Fact]
    public async Task RequestActorMaterializer_mixed_origins_with_trust_boundary_satisfies_security_engines()
    {
        Guid snapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string actorsJson =
            """
            [
              {
                "label": "Ops engineer",
                "kind": "Human",
                "trustOrigin": "Internal",
                "contract": "Sync",
                "origin": "Asserted",
                "confidence": 100
              },
              {
                "label": "Partner portal user",
                "kind": "Human",
                "trustOrigin": "External",
                "contract": "Sync",
                "origin": "Asserted",
                "confidence": 100
              }
            ]
            """;

        IReadOnlyList<GraphNode> materialized =
            ArchLucid.KnowledgeGraph.Materialization.RequestActorMaterializer.MaterializeFromActorsJson(
                actorsJson,
                snapshotId);

        materialized.Should().HaveCount(3);
        materialized.Should().Contain(n => n.NodeType == GraphNodeTypes.TrustBoundary);

        GraphSnapshot snapshot = new()
        {
            Nodes = materialized.ToList(),
        };

        TrustBoundaryFindingEngine trustBoundaryEngine =
            new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));
        ExternalExposureFindingEngine externalExposureEngine =
            new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));
        PrivilegedAccessFindingEngine privilegedAccessEngine =
            new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));

        IReadOnlyList<Finding> trustBoundaryFindings =
            await trustBoundaryEngine.AnalyzeAsync(snapshot, null, CancellationToken.None);
        IReadOnlyList<Finding> externalExposureFindings =
            await externalExposureEngine.AnalyzeAsync(snapshot, null, CancellationToken.None);
        IReadOnlyList<Finding> privilegedAccessFindings =
            await privilegedAccessEngine.AnalyzeAsync(snapshot, null, CancellationToken.None);

        trustBoundaryFindings.Should().BeEmpty();
        externalExposureFindings.Should().BeEmpty();
        privilegedAccessFindings.Should().ContainSingle();
        privilegedAccessFindings[0].EngineType.Should().Be("privileged-access");
    }

    [Fact]
    public async Task RequestActorMaterializer_external_actor_without_boundary_fires_external_exposure()
    {
        Guid snapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string actorsJson =
            """
            [
              {
                "label": "Anonymous user",
                "kind": "Human",
                "trustOrigin": "PublicAnonymous",
                "contract": "Sync",
                "origin": "Asserted",
                "confidence": 100
              }
            ]
            """;

        IReadOnlyList<GraphNode> materialized =
            ArchLucid.KnowledgeGraph.Materialization.RequestActorMaterializer.MaterializeFromActorsJson(
                actorsJson,
                snapshotId);

        GraphNode actorNode = materialized.Should().ContainSingle(n => n.NodeType == GraphNodeTypes.Actor).Subject;
        materialized.Should().Contain(n => n.NodeType == GraphNodeTypes.TrustBoundary);

        GraphSnapshot snapshotWithBoundary = new()
        {
            Nodes = materialized.ToList(),
        };

        ExternalExposureFindingEngine sut = new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));

        IReadOnlyList<Finding> withBoundary =
            await sut.AnalyzeAsync(snapshotWithBoundary, null, CancellationToken.None);

        withBoundary.Should().BeEmpty();

        GraphSnapshot snapshotWithoutBoundary = new()
        {
            Nodes = [actorNode],
        };

        IReadOnlyList<Finding> withoutBoundary =
            await sut.AnalyzeAsync(snapshotWithoutBoundary, null, CancellationToken.None);

        withoutBoundary.Should().ContainSingle();
        withoutBoundary[0].EngineType.Should().Be("external-exposure");
    }

    private static ComplianceRulePack CreateFailOpenPack() =>
        new()
        {
            RulePackId = "actor-security-fail-open",
            Name = "Actor security fail-open",
            Version = "1",
            Rules =
            [
                new ComplianceRule
                {
                    RuleId = "cost-opt-001",
                    ControlId = "c",
                    ControlName = "n",
                    AppliesToCategory = "cat",
                    RequiredNodeType = "t",
                    RequiredEdgeType = "e",
                    Description = "d",
                },
            ],
        };
}

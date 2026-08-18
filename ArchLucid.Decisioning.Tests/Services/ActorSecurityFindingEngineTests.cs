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

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, CancellationToken.None);

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

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, CancellationToken.None);

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

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("privileged-access");
    }
}

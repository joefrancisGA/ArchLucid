using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;
namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class RequiredCapabilityCoverageAnalyzerTests
{
    [Fact]
    public void Analyze_reports_missing_encryption_capability()
    {
        GraphSnapshot snapshot = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "ctx",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] = "encryption-at-rest",
                    },
                },
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = "compute",
                },
            ],
        };

        RequiredCapabilityCoverageResult result = new RequiredCapabilityCoverageAnalyzer().Analyze(snapshot);

        result.MissingCapabilities.Should().ContainSingle().Which.Should().Be("encryption-at-rest");
    }
}

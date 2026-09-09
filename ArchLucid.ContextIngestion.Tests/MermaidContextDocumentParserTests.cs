using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class MermaidContextDocumentParserTests
{
    private readonly MermaidContextDocumentParser parser = new();

    [Fact]
    public async Task ParseAsync_FlowchartFixture_YieldsTopologyNodesWithConnectivity()
    {
        const string mermaid = """
            flowchart LR
                api["API Gateway"]
                db["SQL Database"]
                api -->|"queries"| db
            """;

        ContextDocumentReference document = new()
        {
            DocumentId = "doc-mermaid-fixture",
            Name = "topology.mmd",
            ContentType = SupportedContextDocumentContentTypes.Mermaid,
            Content = mermaid,
        };

        IReadOnlyList<CanonicalObject> objects = await this.parser.ParseAsync(document, CancellationToken.None);

        objects.Should().HaveCount(2);
        objects.Should().OnlyContain(obj => obj.SourceType == ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType);
        objects.Should().Contain(obj => obj.ObjectType == GraphNodeTypes.TopologyResource && obj.Name.Contains("API Gateway", StringComparison.Ordinal));
        objects.Should().Contain(obj => obj.ObjectType == GraphNodeTypes.TopologyResource && obj.Name.Contains("SQL Database", StringComparison.Ordinal));

        CanonicalObject api = objects.Single(obj => obj.Properties["diagramNodeId"] == "api");
        api.Properties.Should().ContainKey("connectedToNodeIds");
        api.Properties["connectedToNodeIds"].Should().StartWith("obj-");
        api.Properties["extractionMethod"].Should().Be(DiagramExtractionMethods.StructuredParse);
    }

    [Fact]
    public async Task ParseAsync_GarbageMermaid_ReturnsEmptyWithoutThrowing()
    {
        ContextDocumentReference document = new()
        {
            DocumentId = "doc-garbage",
            Name = "garbage.mmd",
            ContentType = SupportedContextDocumentContentTypes.Mermaid,
            Content = "%%% not valid mermaid @@@",
        };

        IReadOnlyList<CanonicalObject> objects = await this.parser.ParseAsync(document, CancellationToken.None);

        objects.Should().BeEmpty();
    }

    [Fact]
    public void CanParse_OnlyAcceptsMermaidMimeType()
    {
        this.parser.CanParse(SupportedContextDocumentContentTypes.Mermaid).Should().BeTrue();
        this.parser.CanParse("text/plain").Should().BeFalse();
        this.parser.CanParse("application/vnd.archlucid.diagram+json").Should().BeFalse();
    }
}

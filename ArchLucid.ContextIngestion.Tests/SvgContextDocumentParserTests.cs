using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class SvgContextDocumentParserTests
{
    private readonly SvgContextDocumentParser parser = new();

    [Fact]
    public async Task ParseAsync_LabeledSvgFixture_YieldsTopologyNodes()
    {
        const string svg = """
            <svg xmlns="http://www.w3.org/2000/svg">
              <g id="api">
                <rect x="0" y="0" width="100" height="40"/>
                <text x="50" y="25">API Gateway</text>
              </g>
            </svg>
            """;

        ContextDocumentReference document = new()
        {
            DocumentId = "doc-svg-fixture",
            Name = "topology.svg",
            ContentType = SupportedContextDocumentContentTypes.StructuredDiagramSvg,
            Content = svg,
        };

        IReadOnlyList<CanonicalObject> objects = await this.parser.ParseAsync(document, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be(GraphNodeTypes.TopologyResource);
        objects[0].SourceType.Should().Be(ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType);
        objects[0].Properties["extractionMethod"].Should().Be(DiagramExtractionMethods.StructuredParse);
    }

    [Fact]
    public void CanParse_OnlyAcceptsStructuredDiagramSvgMimeType()
    {
        this.parser.CanParse(SupportedContextDocumentContentTypes.StructuredDiagramSvg).Should().BeTrue();
        this.parser.CanParse("image/svg+xml").Should().BeFalse();
    }
}

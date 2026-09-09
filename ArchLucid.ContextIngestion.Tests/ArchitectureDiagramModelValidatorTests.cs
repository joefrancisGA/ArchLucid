using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class ArchitectureDiagramModelValidatorTests
{
    [Fact]
    public void ArchLucidDiagramJsonParser_round_trips_valid_model()
    {
        ArchLucidDiagramJsonParser parser = new();
        DiagramSourceReference source = new()
        {
            Name = "diagram.json",
            Format = DiagramSourceFormats.ArchLucidDiagramJson,
            Content =
                """
                {
                  "nodes": [
                    { "id": "api", "label": "API", "kind": "system" }
                  ],
                  "edges": [],
                  "subgraphs": [
                    { "id": "lane-a", "label": "Lane A", "orderKey": 1 }
                  ],
                  "extractionMethod": "StructuredParse",
                  "sourceEvidenceItemId": "evidence-1"
                }
                """,
        };

        DiagramParseResult result = parser.Parse(source);

        result.Warnings.Should().BeEmpty();
        result.Model.Nodes.Should().ContainSingle().Which.Id.Should().Be("api");
        result.Model.Subgraphs.Should().ContainSingle().Which.Id.Should().Be("lane-a");
        result.Model.SourceEvidenceItemId.Should().Be("evidence-1");
    }

    [Fact]
    public void ArchLucidDiagramJsonParser_rejects_garbage_ids()
    {
        ArchLucidDiagramJsonParser parser = new();
        DiagramParseResult result = parser.Parse(new DiagramSourceReference
        {
            Name = "diagram.json",
            Format = DiagramSourceFormats.ArchLucidDiagramJson,
            Content =
                """
                {
                  "nodes": [
                    { "id": "bad id", "label": "Bad" }
                  ],
                  "edges": []
                }
                """,
        });

        result.Warnings.Should().ContainSingle()
            .Which.Should().Contain("invalid");
    }
}

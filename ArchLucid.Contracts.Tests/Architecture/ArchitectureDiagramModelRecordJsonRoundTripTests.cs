using System.Text.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Suite", "Core")]
public sealed class ArchitectureDiagramModelRecordJsonRoundTripTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    [Fact]
    public void RoundTrip_preserves_subgraphs_extraction_method_and_evidence_item_id()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    SubgraphId = "lane-a",
                },
            ],
            Edges = [],
            Subgraphs =
            [
                new ArchitectureDiagramSubgraphRecord
                {
                    Id = "lane-a",
                    Label = "Lane A",
                    OrderKey = 1,
                },
            ],
            TrustBoundaryLabels = ["DMZ"],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            SourceEvidenceItemId = "evidence-1",
        };

        string json = JsonSerializer.Serialize(model, JsonOptions);
        ArchitectureDiagramModelRecord? roundTripped = JsonSerializer.Deserialize<ArchitectureDiagramModelRecord>(json, JsonOptions);

        roundTripped.Should().NotBeNull();
        roundTripped!.Subgraphs.Should().ContainSingle()
            .Which.Id.Should().Be("lane-a");
        roundTripped.ExtractionMethod.Should().Be(DiagramExtractionMethods.StructuredParse);
        roundTripped.SourceEvidenceItemId.Should().Be("evidence-1");
        roundTripped.Nodes[0].SubgraphId.Should().Be("lane-a");
    }

    [Fact]
    public void TryValidate_empty_nodes_is_valid()
    {
        ArchitectureDiagramModelRecord model = new();

        bool valid = ArchitectureDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeTrue();
        failureReason.Should().BeNull();
    }

    [Fact]
    public void TryValidate_rejects_garbage_node_ids()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord { Id = "bad id", Label = "Bad" },
            ],
        };

        bool valid = ArchitectureDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeFalse();
        failureReason.Should().Contain("invalid");
    }
}

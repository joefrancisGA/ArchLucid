using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

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

    [Fact]
    public void TryValidate_accepts_edge_and_subgraph_references_when_ids_differ_only_by_case()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Subgraphs =
            [
                new ArchitectureDiagramSubgraphRecord { Id = "corp", Label = "Corporate network" },
            ],
            Nodes =
            [
                new ArchitectureDiagramNodeRecord { Id = "api", Label = "API", SubgraphId = "CORP" },
                new ArchitectureDiagramNodeRecord { Id = "sql", Label = "SQL" },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord { Id = "e1", SourceId = "API", TargetId = "sql" },
            ],
        };

        bool valid = ArchitectureDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeTrue();
        failureReason.Should().BeNull();
    }

    [Theory]
    [InlineData("api", "missing")]
    [InlineData("missing", "api")]
    public void TryValidate_rejects_an_edge_with_an_unknown_source_or_target(string sourceId, string targetId)
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes = [new ArchitectureDiagramNodeRecord { Id = "api", Label = "API" }],
            Edges = [new ArchitectureDiagramEdgeRecord { Id = "e1", SourceId = sourceId, TargetId = targetId }],
        };

        bool valid = ArchitectureDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeFalse();
        failureReason.Should().Contain("unknown node id");
    }

    [Fact]
    public void TryValidate_matches_padded_ids_and_references_in_a_nested_diagram()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Subgraphs =
            [
                new ArchitectureDiagramSubgraphRecord { Id = "  network ", Label = "Network" },
                new ArchitectureDiagramSubgraphRecord { Id = " services  ", Label = "Services", ParentSubgraphId = " network  " },
            ],
            Nodes =
            [
                new ArchitectureDiagramNodeRecord { Id = "  api ", Label = "API", SubgraphId = " services " },
                new ArchitectureDiagramNodeRecord { Id = " store  ", Label = "Data store", SubgraphId = "  network " },
            ],
            Edges = [new ArchitectureDiagramEdgeRecord { Id = "data-flow", SourceId = " api  ", TargetId = "  store " }],
        };

        bool valid = ArchitectureDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeTrue();
        failureReason.Should().BeNull();
    }

    [Fact]
    public void TryValidate_rejects_a_subgraph_with_an_unknown_parent()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Subgraphs =
            [
                new ArchitectureDiagramSubgraphRecord { Id = "network", Label = "Network" },
                new ArchitectureDiagramSubgraphRecord { Id = "services", Label = "Services", ParentSubgraphId = "missing" },
            ],
        };

        bool valid = ArchitectureDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeFalse();
        failureReason.Should().Contain("unknown parent").And.Contain("missing");
    }

    [Fact]
    public void TryValidate_rejects_unknown_node_kind()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord { Id = "api", Label = "API", Kind = "service " },
            ],
        };

        bool valid = ArchitectureDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeFalse();
        failureReason.Should().Contain("kind");
    }

    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "nodes": null,
              "edges": null,
              "subgraphs": null,
              "trustBoundaryLabels": null
            }
            """;

        ArchitectureDiagramModelRecord model =
            JsonSerializer.Deserialize<ArchitectureDiagramModelRecord>(json, ContractJson.Default)!;

        model.Nodes.Should().NotBeNull().And.BeEmpty();
        model.Edges.Should().NotBeNull().And.BeEmpty();
        model.Subgraphs.Should().NotBeNull().And.BeEmpty();
        model.TrustBoundaryLabels.Should().NotBeNull().And.BeEmpty();
    }
}

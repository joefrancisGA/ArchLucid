using System.Text.Json;

using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Provenance;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Services.Ask;

[Trait("Category", "Unit")]
public sealed class ContextBuilderTests
{
    [Fact]
    public void BuildContext_without_manifest_marks_manifest_unavailable()
    {
        object context = ContextBuilder.BuildContext(manifest: null, provenance: null, comparison: null);
        using JsonDocument json = JsonSerializer.SerializeToDocument(context);

        json.RootElement.GetProperty("ManifestAvailable").GetBoolean().Should().BeFalse();
        json.RootElement.GetProperty("ComparisonSummary").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void BuildContext_with_manifest_nullifies_blank_rationale_and_includes_graph()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new() { Summary = "summary" },
            Decisions =
            [
                new()
                {
                    DecisionId = "d1",
                    Category = "security",
                    Title = "Encrypt data",
                    SelectedOption = "aes",
                    Rationale = "   ",
                    SupportingFindingIds = ["f1"],
                },
            ],
        };
        GraphViewModel provenance = new()
        {
            Nodes = [new() { Id = "n1", Label = "Node 1", Type = "decision" }],
            Edges = [new() { Source = "n1", Target = "n2", Type = "supports" }],
        };
        ComparisonResult comparison = new()
        {
            BaseRunId = Guid.NewGuid(),
            TargetRunId = Guid.NewGuid(),
            SummaryHighlights = ["changed"],
            RequirementChanges = [new() { RequirementName = "req-1", ChangeType = "Modified" }],
            CostChanges = [new() { BaseCost = 10, TargetCost = 20 }],
        };

        object context = ContextBuilder.BuildContext(manifest, provenance, comparison);
        using JsonDocument json = JsonSerializer.SerializeToDocument(context);

        json.RootElement.GetProperty("ManifestAvailable").GetBoolean().Should().BeTrue();
        json.RootElement.GetProperty("Decisions")[0].GetProperty("Rationale").ValueKind.Should().Be(JsonValueKind.Null);
        json.RootElement.GetProperty("ProvenanceGraph").GetProperty("NodeCount").GetInt32().Should().Be(1);
        json.RootElement.GetProperty("ComparisonSummary").GetProperty("RequirementChangeCount").GetInt32().Should().Be(1);
        json.RootElement.GetProperty("ComparisonSummary").GetProperty("CostChangeCount").GetInt32().Should().Be(1);
    }

    [Fact]
    public void BuildContext_with_manifest_and_no_provenance_omits_graph_section()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Decisions =
            [
                new()
                {
                    DecisionId = "d2",
                    Category = "cost",
                    Title = "Right-size",
                    SelectedOption = "small",
                    Rationale = "save money",
                },
            ],
        };

        object context = ContextBuilder.BuildContext(manifest, provenance: null, comparison: null);
        using JsonDocument json = JsonSerializer.SerializeToDocument(context);

        json.RootElement.GetProperty("ManifestAvailable").GetBoolean().Should().BeTrue();
        json.RootElement.GetProperty("ProvenanceGraph").ValueKind.Should().Be(JsonValueKind.Null);
        json.RootElement.GetProperty("Decisions")[0].GetProperty("Rationale").GetString().Should().Be("save money");
    }
}

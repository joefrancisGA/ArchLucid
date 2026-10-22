using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class ManifestDiagramSemanticOverlayDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "actors": null,
              "trustBoundaryLabels": null,
              "requirementLabels": null,
              "decisionLabels": null
            }
            """;

        ManifestDiagramSemanticOverlay overlay =
            JsonSerializer.Deserialize<ManifestDiagramSemanticOverlay>(json, ContractJson.Default)!;

        overlay.Actors.Should().NotBeNull().And.BeEmpty();
        overlay.TrustBoundaryLabels.Should().NotBeNull().And.BeEmpty();
        overlay.RequirementLabels.Should().NotBeNull().And.BeEmpty();
        overlay.DecisionLabels.Should().NotBeNull().And.BeEmpty();
    }
}

using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>RC29d package-coverage batch: inventory generator and artifact model property bags.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc29dTests
{
    [Fact]
    public async Task InventoryArtifactGenerator_maps_manifest_sections_to_inventory_items()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            ManifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Requirements = new RequirementsCoverageSection
            {
                Covered = [new RequirementCoverageItem { RequirementName = "R1", CoverageStatus = "Covered" }],
                Uncovered = [new RequirementCoverageItem { RequirementName = "R2", CoverageStatus = "Gap" }],
            },
            Security = new SecuritySection
            {
                Controls = [new SecurityPostureItem { ControlName = "WAF", Status = "Implemented", Impact = "ingress" }],
                Gaps = [],
            },
            Compliance = new ComplianceSection
            {
                Controls = [new CompliancePostureItem { ControlName = "SOC", Status = "Partial", AppliesToCategory = "audit" }],
                Gaps = [],
            },
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items = [new ManifestIssue { Title = "open issue", Severity = "Medium", Description = "detail" }],
            },
        };

        InventoryArtifactGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.Inventory);
        artifact.Name.Should().Be("inventory.json");

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement items = doc.RootElement.GetProperty("Items");
        items.GetArrayLength().Should().Be(5);
    }

    [Fact]
    public void CoverageSummary_and_compliance_matrix_models_roundtrip_properties()
    {
        CoverageSummaryArtifactModel coverage = new()
        {
            CoveredRequirementCount = 3,
            UncoveredRequirementCount = 1,
            SecurityGapCount = 2,
            ComplianceGapCount = 1,
            UnresolvedIssueCount = 4,
            TopologyGaps = ["no DR region"],
        };

        ComplianceMatrixArtifactModel matrix = new()
        {
            Rows = [
                new ComplianceMatrixRow
                {
                    ControlName = "SOC logging",
                    Status = "Partial",
                    Notes = "retention gap",
                },
            ],
        };

        coverage.TopologyGaps.Should().ContainSingle("no DR region");
        matrix.Rows[0].ControlName.Should().Be("SOC logging");
        matrix.Rows[0].Notes.Should().Contain("retention");
    }
}

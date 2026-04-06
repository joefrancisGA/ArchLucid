using System.Text.Json;

using ArchiForge.ArtifactSynthesis.Generators;
using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.Decisioning.Manifest.Sections;
using ArchiForge.Decisioning.Models;

using FluentAssertions;

namespace ArchiForge.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryArtifactGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_serializes_requirements_security_compliance_and_issues()
    {
        GoldenManifest manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Requirements = new RequirementsCoverageSection
            {
                Covered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = "R1",
                        CoverageStatus = "Met",
                        RequirementText = "text",
                    },
                ],
                Uncovered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = "R2",
                        CoverageStatus = "Gap",
                        RequirementText = "gap",
                    },
                ],
            },
            Security = new SecuritySection
            {
                Controls =
                [
                    new SecurityPostureItem
                    {
                        ControlName = "SC1",
                        Status = "Ok",
                        Impact = "low",
                    },
                ],
            },
            Compliance = new ComplianceSection
            {
                Controls =
                [
                    new CompliancePostureItem
                    {
                        ControlName = "CC1",
                        Status = "Pass",
                        AppliesToCategory = "net",
                    },
                ],
            },
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue
                    {
                        Title = "Issue1",
                        Severity = "High",
                        Description = "desc",
                    },
                ],
            },
        };

        InventoryArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.Inventory);
        artifact.ContentHash.Should().NotBeNullOrWhiteSpace();

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement root = doc.RootElement;
        root.GetProperty("Items").GetArrayLength().Should().Be(5);
    }
}

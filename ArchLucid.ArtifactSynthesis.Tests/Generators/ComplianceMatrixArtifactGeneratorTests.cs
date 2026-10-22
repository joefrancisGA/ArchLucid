using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.Generators;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComplianceMatrixArtifactGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_maps_controls_and_matching_gap_notes()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Compliance = new ComplianceSection
            {
                Controls =
                [
                    new CompliancePostureItem
                    {
                        ControlId = "c1",
                        ControlName = "Encrypt data",
                        AppliesToCategory = "storage",
                        Status = "Pass",
                    },
                ],
                Gaps = ["Encrypt data: key rotation missing"],
            },
        };

        ComplianceMatrixArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.ComplianceMatrix);
        artifact.Name.Should().Be("compliance-matrix.json");

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement row = doc.RootElement.GetProperty("Rows")[0];
        row.GetProperty("ControlId").GetString().Should().Be("c1");
        row.GetProperty("Notes").GetString().Should().Contain("key rotation");
    }

    [Fact]
    public async Task GenerateAsync_does_not_attribute_gap_to_shorter_substring_control_name()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Compliance = new ComplianceSection
            {
                Controls =
                [
                    new CompliancePostureItem
                    {
                        ControlId = "encrypt",
                        ControlName = "Encrypt",
                        AppliesToCategory = "storage",
                        Status = "Pass",
                    },
                    new CompliancePostureItem
                    {
                        ControlId = "encrypt-data",
                        ControlName = "Encrypt data",
                        AppliesToCategory = "storage",
                        Status = "Partial",
                    },
                ],
                Gaps = ["Encrypt data: key rotation missing"],
            },
        };

        ComplianceMatrixArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement rows = doc.RootElement.GetProperty("Rows");

        rows[0].GetProperty("ControlId").GetString().Should().Be("encrypt");
        rows[0].GetProperty("Notes").GetString().Should().BeEmpty();

        rows[1].GetProperty("ControlId").GetString().Should().Be("encrypt-data");
        rows[1].GetProperty("Notes").GetString().Should().Contain("key rotation");
    }
}

using System.Text.Json;

using ArchLucid.Application.Exports;
using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotProofPacketArtifactManifestBuilderTests
{
    [Fact]
    public void BuildJson_includes_cg027_career_posture_overlay()
    {
        ExportBundleCareerPostureStamp stamp = new(
            "Simulator",
            WorkingCareerRehearsalDoorValues.Rehearsal,
            RehearsalIncomplete: true,
            ExportBundleCareerPostureResolver.CareerPostureRehearsal);

        string json = PilotProofPacketArtifactManifestBuilder.BuildJson(
            "run-abc",
            ["artifact-1"],
            stamp);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("schema").GetString().Should().Be(PilotProofPacketArtifactCatalog.ArtifactManifestSchema);
        root.GetProperty("careerPosture").GetString().Should().Be(ExportBundleCareerPostureResolver.CareerPostureRehearsal);
        root.GetProperty("structuralExecutionMode").GetString().Should().Be("Simulator");
        root.GetProperty("workingCareerRehearsalDoor").GetString().Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
        root.GetProperty("rehearsalIncomplete").GetBoolean().Should().BeTrue();
    }
}

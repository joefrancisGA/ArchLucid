using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotProofPacketRedactionManifestBuilderTests
{
    [Fact]
    public void BuildJson_reports_pass_status_when_redaction_applied()
    {
        string json = PilotProofPacketRedactionManifestBuilder.BuildJson(redactionPassApplied: true);

        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;

        root.GetProperty("status").GetString().Should().Be("PASS");
        root.GetProperty("redactionPassAppliedToProofPacket").GetBoolean().Should().BeTrue();
        root.GetProperty("secretDetectionStatus").GetString()
            .Should().Be("NOT_RECORDED_BY_DESIGN_BUYER_SAFE_EXPORT");
        root.GetProperty("schema").GetString().Should().Be(PilotProofPacketArtifactCatalog.RedactionManifestSchema);
    }

    [Fact]
    public void BuildJson_reports_not_applied_status_when_redaction_skipped()
    {
        string json = PilotProofPacketRedactionManifestBuilder.BuildJson(redactionPassApplied: false);

        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;

        root.GetProperty("status").GetString().Should().Be("NOT_APPLIED");
        root.GetProperty("redactionPassAppliedToProofPacket").GetBoolean().Should().BeFalse();
        root.GetProperty("secretDetectionStatus").GetString()
            .Should().Be("NOT_SCANNED_REDACTION_PASS_NOT_APPLIED");
    }

    [Fact]
    public void BuildJson_leaves_file_integrity_empty_when_output_directory_is_not_provided()
    {
        string json = PilotProofPacketRedactionManifestBuilder.BuildJson(redactionPassApplied: true);

        using JsonDocument document = JsonDocument.Parse(json);

        document.RootElement.GetProperty("fileIntegrity").GetArrayLength().Should().Be(0);
        document.RootElement.GetProperty("filesCovered").GetArrayLength()
            .Should().Be(PilotProofPacketArtifactCatalog.CoreFileNames.Count);
    }

    [Fact]
    public void BuildJson_leaves_file_integrity_empty_when_output_directory_does_not_exist()
    {
        string missingDirectory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));

        string json = PilotProofPacketRedactionManifestBuilder.BuildJson(
            redactionPassApplied: true,
            outputDirectory: missingDirectory);

        using JsonDocument document = JsonDocument.Parse(json);

        document.RootElement.GetProperty("fileIntegrity").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public void BuildJson_includes_limitations_and_reviewer_instructions()
    {
        string json = PilotProofPacketRedactionManifestBuilder.BuildJson(redactionPassApplied: true);

        using JsonDocument document = JsonDocument.Parse(json);

        document.RootElement.GetProperty("limitations").GetArrayLength().Should().BeGreaterThan(0);
        document.RootElement.GetProperty("reviewerInstructions").GetArrayLength().Should().BeGreaterThan(0);
    }
}

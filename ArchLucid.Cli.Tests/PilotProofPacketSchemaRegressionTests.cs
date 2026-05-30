using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotProofPacketSchemaRegressionTests
{
    [Fact]
    public void Artifact_catalog_covers_expected_core_files()
    {
        PilotProofPacketArtifactCatalog.CoreFileNames.Should().Contain(
        [
            "run-evidence.json",
            "quote-to-proof-readiness.json",
            "redaction-manifest.json",
            "governance-outcome-summary.json",
        ]);
    }

    [Fact]
    public void Redaction_manifest_uses_stable_schema_and_pass_status()
    {
        string json = PilotProofPacketRedactionManifestBuilder.BuildJson(redactionPassApplied: true);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("schema").GetString().Should().Be(PilotProofPacketArtifactCatalog.RedactionManifestSchema);
        root.GetProperty("status").GetString().Should().Be("PASS");
        root.GetProperty("redactionPassAppliedToProofPacket").GetBoolean().Should().BeTrue();
        root.GetProperty("fileIntegrity").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public void Redaction_manifest_includes_file_integrity_when_output_directory_provided()
    {
        string dir = Path.Combine(Path.GetTempPath(), "proofPacket." + Guid.NewGuid().ToString("N")[..8]);

        try
        {
            Directory.CreateDirectory(dir);
            File.WriteAllText(Path.Combine(dir, "run-evidence.json"), "{}");

            string json = PilotProofPacketRedactionManifestBuilder.BuildJson(
                redactionPassApplied: true,
                outputDirectory: dir);

            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement entry = doc.RootElement.GetProperty("fileIntegrity")[0];

            entry.GetProperty("fileName").GetString().Should().Be("run-evidence.json");
            entry.GetProperty("sha256Hex").GetString().Should().HaveLength(64);
        }
        finally
        {
            if (Directory.Exists(dir))
                Directory.Delete(dir, true);
        }
    }

    [Fact]
    public void Quote_to_proof_json_uses_stable_schema_id()
    {
        string json = PilotProofPacketCommercialReadinessBuilder.BuildJson("run-abc", "{}", demoWarning: false, pilotStrictSatisfied: true);

        using JsonDocument doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("schema").GetString().Should().Be(PilotProofPacketArtifactCatalog.QuoteToProofSchema);
    }
}

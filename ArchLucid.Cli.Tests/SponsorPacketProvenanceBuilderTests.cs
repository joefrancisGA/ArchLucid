using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SponsorPacketProvenanceBuilderTests
{
    [Fact]
    public void BuildJson_composes_audit_and_artifact_ids_without_payloads()
    {
        string audit = """{"auditEventIds":["evt-1","evt-2"]}""";
        string artifacts = """{"artifactIds":["art-9"]}""";

        string json = SponsorPacketProvenanceBuilder.BuildJson("run-abc", audit, artifacts);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("schema").GetString().Should().Be(SponsorPacketArtifactCatalog.ProvenanceSchema);
        root.GetProperty("runId").GetString().Should().Be("run-abc");
        root.GetProperty("auditEventIds").GetArrayLength().Should().Be(2);
        root.GetProperty("artifactIds").GetArrayLength().Should().Be(1);
        root.GetProperty("note").GetString().Should().Contain("Ids only");
    }
}

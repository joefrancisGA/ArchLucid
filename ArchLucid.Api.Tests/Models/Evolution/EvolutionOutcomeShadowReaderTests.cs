using System.Text.Json;

using ArchLucid.Api.Models.Evolution;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Models.Evolution;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EvolutionOutcomeShadowReaderTests
{
    [SkippableFact]
    public void TryReadShadow_empty_json_reports_none()
    {
        EvolutionOutcomeShadowReader.TryReadShadow("", out EvolutionShadowOutcomeSnapshot? shadow, out string kind);

        shadow.Should().BeNull();
        kind.Should().Be("none");
    }

    [SkippableFact]
    public void TryReadShadow_schema_v2_reads_nested_shadow()
    {
        string json = JsonSerializer.Serialize(
            new
            {
                schemaVersion = EvolutionOutcomeParser.SchemaV2,
                shadow = new { architectureRunId = "run-1", shadowScore = 0.42 }
            });

        EvolutionOutcomeShadowReader.TryReadShadow(json, out EvolutionShadowOutcomeSnapshot? shadow, out string kind);

        shadow.Should().NotBeNull();
        shadow!.ArchitectureRunId.Should().Be("run-1");
        kind.Should().Be(EvolutionOutcomeParser.SchemaV2);
    }

    [SkippableFact]
    public void TryReadShadow_invalid_json_reports_invalid()
    {
        EvolutionOutcomeShadowReader.TryReadShadow("{not-json", out _, out string kind);

        kind.Should().Be("invalid");
    }
}

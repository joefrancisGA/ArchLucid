using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DefenderSummaryCompanionMaterializerTests
{
    [Fact]
    public void Materialize_maps_valid_companion_rows()
    {
        JsonElement[] defenderSummary =
        [
            JsonDocument.Parse(
                """
                {
                  "resourceId": "/subscriptions/11111111-1111-1111-1111-111111111111",
                  "secureScore": 72
                }
                """).RootElement,
        ];

        IReadOnlyList<AzureInventoryDefenderSummaryWrite> rows =
            DefenderSummaryCompanionMaterializer.Materialize(defenderSummary);

        rows.Should().ContainSingle();
        rows[0].SecureScore.Should().Be(72);
        rows[0].ResourceId.Should().Contain("11111111-1111-1111-1111-111111111111");
        rows[0].SourceEvidenceReference.Should().Be(AzureExtractorPackageZipEntryNames.DefenderSummary);
    }

    [Fact]
    public void Materialize_skips_malformed_rows()
    {
        JsonElement[] defenderSummary =
        [
            JsonDocument.Parse("""{ "resourceId": "/subscriptions/sub" }""").RootElement,
            JsonDocument.Parse("""{ "secureScore": 50 }""").RootElement,
            JsonDocument.Parse("""{ "resourceId": "/subscriptions/sub", "secureScore": "high" }""").RootElement,
        ];

        DefenderSummaryCompanionMaterializer.Materialize(defenderSummary).Should().BeEmpty();
    }
}

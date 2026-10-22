using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidModePreviewDeserializationTests
{
    [Fact]
    public void Deserialize_null_fallback_artifacts_yields_empty_list_not_null()
    {
        const string json = """
            {
              "fallbackArtifacts": null
            }
            """;

        InfraEvidenceMermaidModePreview? preview =
            JsonSerializer.Deserialize<InfraEvidenceMermaidModePreview>(json, ContractJson.CamelCaseCompact);

        preview.Should().NotBeNull();
        preview!.FallbackArtifacts.Should().NotBeNull().And.BeEmpty();
    }
}

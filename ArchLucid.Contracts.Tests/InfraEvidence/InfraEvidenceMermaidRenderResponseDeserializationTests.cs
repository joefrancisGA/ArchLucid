using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidRenderResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "fallbackArtifacts": null,
              "completenessWarnings": null
            }
            """;

        InfraEvidenceMermaidRenderResponse? response =
            JsonSerializer.Deserialize<InfraEvidenceMermaidRenderResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.FallbackArtifacts.Should().NotBeNull().And.BeEmpty();
        response.CompletenessWarnings.Should().NotBeNull().And.BeEmpty();
    }
}

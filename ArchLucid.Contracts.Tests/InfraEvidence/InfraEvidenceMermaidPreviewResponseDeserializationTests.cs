using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidPreviewResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "modes": null,
              "completenessWarnings": null
            }
            """;

        InfraEvidenceMermaidPreviewResponse? response =
            JsonSerializer.Deserialize<InfraEvidenceMermaidPreviewResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Modes.Should().NotBeNull().And.BeEmpty();
        response.CompletenessWarnings.Should().NotBeNull().And.BeEmpty();
    }
}

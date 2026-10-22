using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class TenantBrandingPresentationResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_colors_yields_non_null_colors_not_null()
    {
        const string json = """
            {
              "context": "masthead",
              "colors": null
            }
            """;

        TenantBrandingPresentationResponse? response =
            JsonSerializer.Deserialize<TenantBrandingPresentationResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Colors.Should().NotBeNull();
    }
}

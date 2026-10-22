using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class RoiSponsorFacingScopeManifestDocumentDeserializationTests
{
    [Fact]
    public void Deserialize_null_codes_and_descriptions_yields_non_null_nested_objects()
    {
        const string json = """
            {
              "schemaVersion": 1,
              "codes": null,
              "descriptions": null
            }
            """;

        RoiSponsorFacingScopeManifestDocument? document =
            JsonSerializer.Deserialize<RoiSponsorFacingScopeManifestDocument>(json, ContractJson.CamelCaseCompact);

        document.Should().NotBeNull();
        document!.Codes.Should().NotBeNull();
        document.Descriptions.Should().NotBeNull();
    }
}
